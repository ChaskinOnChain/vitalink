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

async function fetchFollowers(fid) {
  const query = fetchFollowersQuery(fid);
  const { data, error } = await fetchQuery(query);

  if (error) {
    console.error(`Error fetching followers for FID ${fid}:`, error);
    return [];
  }

  // Check if the data is structured as expected
  if (!data || !data.SocialFollowers || !data.SocialFollowers.Follower) {
    console.warn(`No followers data found for FID ${fid}`);
    return [];
  }

  return data.SocialFollowers.Follower.filter(
    (f) =>
      f.followerAddress &&
      f.followerAddress.socials &&
      f.followerAddress.socials.length > 0
  ).map((f) => f.followerAddress.socials[0].userId);
}

async function findConnectionPath(startFid, targetFid = 5650) {
  let queue = [{ fid: startFid, path: [] }];
  let visited = new Set();

  while (queue.length > 0) {
    const { fid, path } = queue.shift();

    if (fid === targetFid) {
      return path.concat(fid);
    }

    if (!visited.has(fid)) {
      visited.add(fid);
      const followers = await fetchFollowers(fid);

      for (const followerFid of followers) {
        if (!visited.has(followerFid)) {
          queue.push({ fid: followerFid, path: path.concat(fid) });
        }
      }
    }
  }
  return []; // Path not found
}

// generate an html page with the relevant opengraph tags
export async function generateFarcasterFrame(fID) {
  init(process.env.AIRSTACK_API);

  const connectionPath = await findConnectionPath(fID);
  console.log("Connection Path:", connectionPath);

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
