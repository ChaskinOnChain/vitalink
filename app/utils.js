import { getHubRpcClient, Message } from "@farcaster/hub-web";
import { NextResponse } from "next/server";
import { init, fetchQueryWithPagination } from "@airstack/node";
// hi
export const BASE_URL = process.env.BASE_URL;

const fetchFollowersQuery = (fid) => `
  query {
    SocialFollowers(input: {
      filter: {
        dappName: { _eq: farcaster }
        identity: { _in: ["fc_fid:${fid}"] }
      }
      blockchain: ALL
      limit: 200
    }) {
      Follower {
        followerAddress {
          socials(input: { filter: { dappName: { _eq: farcaster } } }) {
            userId
          }
        }
      }
    }
  }
`;

async function fetchFollowers(fid) {
  let allFollowers = [];
  let query = fetchFollowersQuery(fid);
  let response = await fetchQueryWithPagination(query);

  while (true) {
    const { data, error, hasNextPage, getNextPage } = response;

    if (error) {
      console.error(`Error fetching followers for FID ${fid}:`, error);
      break;
    }

    if (data && data.SocialFollowers && data.SocialFollowers.Follower) {
      let followers = data.SocialFollowers.Follower.filter(
        (f) =>
          f.followerAddress &&
          f.followerAddress.socials &&
          f.followerAddress.socials.length > 0
      ).map((f) => f.followerAddress.socials[0].userId);

      allFollowers.push(...followers);
    } else {
      console.warn(`No followers data found for FID ${fid}`);
    }

    if (!hasNextPage) break;
    response = await getNextPage();
  }

  return allFollowers;
}

async function findConnectionPath(
  startFid,
  targetFid = 5650,
  maxDepth = 5,
  timeLimit = 9000
) {
  let queue = [{ fid: startFid, path: [], depth: 0 }];
  let visited = new Set();
  let startTime = Date.now();

  while (queue.length > 0) {
    const { fid, path, depth } = queue.shift();

    // Check for time limit
    if (Date.now() - startTime > timeLimit) {
      console.warn("Approaching time limit, terminating search");
      return []; // Return an empty path or partial path as needed
    }

    if (fid === targetFid) {
      return path.concat(fid);
    }

    if (!visited.has(fid) && depth <= maxDepth) {
      visited.add(fid);
      const followers = await fetchFollowers(fid); // Consider adding error handling here

      for (const followerFid of followers) {
        if (!visited.has(followerFid)) {
          queue.unshift({
            // DFS approach: add to the front of the queue
            fid: followerFid,
            path: path.concat(fid),
            depth: depth + 1,
          });
        }
      }
    }
  }

  return []; // Path not found
}

async function checkDirectOrSecondDegreeConnection(
  inputFid,
  vitalikFid = 5650
) {
  let vitalikFollowers = await fetchFollowers(vitalikFid);
  if (vitalikFollowers.includes(inputFid)) {
    return [vitalikFid, inputFid]; // Direct connection found
  }

  for (let followerFid of vitalikFollowers) {
    let followerFollowers = await fetchFollowers(followerFid);
    if (followerFollowers.includes(inputFid)) {
      return [vitalikFid, followerFid, inputFid]; // Second-degree connection found
    }
  }

  return []; // No direct or second-degree connection found
}

// generate an html page with the relevant opengraph tags
export async function generateFarcasterFrame(fID) {
  init(process.env.AIRSTACK_API);

  // First, try to find a direct or second-degree connection
  const directOrSecondDegreePath = await checkDirectOrSecondDegreeConnection(
    fID
  );
  if (directOrSecondDegreePath.length > 0) {
    console.log(
      "Direct or Second Degree Connection Path:",
      directOrSecondDegreePath
    );
    // Return or process this path as needed
  } else {
    // If no direct or second-degree connection, proceed with a comprehensive search
    const connectionPath = await findConnectionPath(fID);
    console.log("Comprehensive Connection Path:", connectionPath);
    // Return or process this comprehensive path as needed
  }

  // return `
  //   <!DOCTYPE html>
  //   <html lang="en">
  //   <head>
  //     <meta property="fc:frame" content="vNext" />
  //     <meta property="fc:frame:image" content="${randomImage}" />
  //     <meta property="fc:frame:button:1" content="Ethereum" />
  //     <meta property="fc:frame:button:2" content="Base" />
  //     <meta property="fc:frame:button:3" content="Zora" />
  //     <meta property="fc:frame:post_url" content="${process.env.BASE_URL}/api" />
  //   </head>
  //   <body>

  //   </body>
  //   </html>
  // `;
}

export async function validateMessage(messageBytes) {
  try {
    const client = getHubRpcClient("https://nemes.farcaster.xyz:2283", {});
    const hubMessage = Message.decode(Buffer.from(messageBytes, "hex"));
    const res = await client.validateMessage(hubMessage);

    if (res.isOk() && res.value.valid) {
      // If valid, proceed with the next response
      return NextResponse.next();
    } else {
      // If invalid, return a JSON response with a 400 status code
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }
  } catch (error) {
    // In case of any other errors, return a 500 Internal Server Error
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
