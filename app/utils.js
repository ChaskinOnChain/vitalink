import { getHubRpcClient, Message } from "@farcaster/hub-web";
import { NextResponse } from "next/server";
import { init, fetchQuery } from "@airstack/node";
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

// Fetch the accounts that a specific FID is following
const fetchFollowingQuery = (fid) => `
  query {
    SocialFollowings(input: {
      filter: {
        dappName: { _eq: "farcaster" }
        identity: { _eq: "${fid}" }
      }
      limit: 200
    }) {
      Following {
        followingAddress {
          socials(input: { filter: { dappName: { _eq: "farcaster" } } }) {
            userId
          }
        }
      }
    }
  }
`;

// Function to fetch the following list
async function fetchFollowing(fid) {
  let query = fetchFollowingQuery(fid);
  let { data, error } = await fetchQuery(query);
  if (error) {
    console.error(`Error fetching following for FID ${fid}:`, error);
    return [];
  }

  return data.SocialFollowings.Following.map(
    (f) => f.followingAddress.socials[0].userId
  );
}

  console.log(
    `No connection found through Vitalik's following for FID ${inputFid}`
  );
  return [];
}

async function fetchFollowers(fid) {
  let query = fetchFollowersQuery(fid);
  let { data, error } = await fetchQuery(query);
  if (error) {
    console.error(`Error fetching followers for FID ${fid}:`, error);
    return [];
  }

  return data.SocialFollowers.Follower.map(
    (f) => f.followerAddress.socials[0].userId
  );
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
  console.log(
    `Checking direct and second-degree connections for FID ${inputFid}`
  );

  let vitalikFollowers = await fetchFollowers(vitalikFid);
  console.log(`Vitalik's followers: ${vitalikFollowers.length}`);

  if (vitalikFollowers.includes(inputFid)) {
    console.log(
      `Direct connection found between ${vitalikFid} and ${inputFid}`
    );
    return [vitalikFid, inputFid];
  }

  for (let followerFid of vitalikFollowers) {
    console.log(`Checking followers of ${followerFid}`);
    let followerFollowers = await fetchFollowers(followerFid);

    if (followerFollowers.includes(inputFid)) {
      console.log(
        `Second-degree connection found: ${vitalikFid} -> ${followerFid} -> ${inputFid}`
      );
      return [vitalikFid, followerFid, inputFid];
    }
  }

  console.log(
    `No direct or second-degree connection found for FID ${inputFid}`
  );
  return [];
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
    console.log(`Proceeding with comprehensive search for FID ${fID}`);
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
