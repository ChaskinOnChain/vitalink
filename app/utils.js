import { getHubRpcClient, Message } from "@farcaster/hub-web";
import { NextResponse } from "next/server";
import { init, fetchQuery } from "@airstack/node";

export const BASE_URL = process.env.BASE_URL;

async function fetchFarcasterFollowers(fid) {
  const query = `
    query {
      SocialFollowers(input: {
        filter: {
          dappName: { _eq: "farcaster" }
          identity: { _eq: "${fid}" }
        }
        limit: 200
      }) {
        Follower {
          followingAddress {
            addresses
            socials(input: { filter: { dappName: { _eq: "farcaster" } } }) {
              userId
            }
          }
        }
      }
    }
  `;

  const { data, error } = await fetchQuery(query);
  return error ? [] : data.SocialFollowers.Follower;
}

async function findConnectionPath(startFid, targetFid) {
  let queue = [startFid];
  let visited = new Set();
  let pathTracker = { [startFid]: [] };

  while (queue.length > 0) {
    const currentFid = queue.shift();

    if (currentFid === targetFid) {
      return pathTracker[currentFid];
    }

    visited.add(currentFid);
    const followers = await fetchFarcasterFollowers(currentFid);

    for (const follower of followers) {
      const followerId = follower.followingAddress.socials[0].userId;
      if (!visited.has(followerId)) {
        visited.add(followerId);
        queue.push(followerId);
        pathTracker[followerId] = [...pathTracker[currentFid], currentFid];
      }
    }
  }

  return []; // No connection path found
}

// generate an html page with the relevant opengraph tags
export async function generateFarcasterFrame(fID) {
  init(process.env.AIRSTACK_API);

  const connectionPath = await fetchFarcasterFollowers(fID);
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
