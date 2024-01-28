import { getHubRpcClient, Message } from "@farcaster/hub-web";
import { NextResponse } from "next/server";
import { init, fetchQuery } from "@airstack/node";
import satori from "satori"; // Import Satori

export const BASE_URL = process.env.BASE_URL;

async function generateImageWithSatori(url) {
  const htmlStructure = (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "600px",
        height: "314px", // Aspect ratio 1.91:1
        border: "5px solid black",
        boxSizing: "border-box",
      }}
    >
      <img src={url} style={{ width: "100%", height: "auto" }} />
    </div>
  );

  const options = {
    width: 600,
    height: 314,
    // Include additional options if needed
  };

  return await satori(htmlStructure, options);
}

// generate an html page with the relevant opengraph tags
export async function generateFarcasterFrame(fID, choice) {
  init(process.env.AIRSTACK_API);

  let blockchain;
  switch (choice) {
    case 1:
      blockchain = "ethereum";
      break;
    case 2:
      blockchain = "base";
      break;
    case 3:
      blockchain = "zora";
      break;
    default:
      blockchain = "ethereum"; // Default to ethereum if choice is invalid
  }

  // Ensure the GraphQL query is properly formatted
  const query = `
      query NFTsOwnedByFarcasterUser {
        TokenBalances(
          input: {
            filter: {
              owner: { _in: ["fc_fid:${fID}"] }
              tokenType: { _in: [ERC1155, ERC721] }
            }
            blockchain: ${blockchain}
            limit: 50
          }
        ) {
          TokenBalance {
            owner {
              socials(input: { filter: { dappName: { _eq: farcaster } } }) {
                profileName
                userId
                userAssociatedAddresses
              }
            }
            amount
            tokenAddress
            tokenId
            tokenType
            tokenNfts {
              contentValue {
                image {
                  extraSmall
                  small
                  medium
                  large
                }
              }
            }
          }
          pageInfo {
            nextCursor
            prevCursor
          }
        }
      }
    `;

  const { data, error } = await fetchQuery(query);

  // Check for error or if data is empty
  if (error || !data.TokenBalances.TokenBalance.length) {
    console.error("Error fetching data or no data available:", error);
    return null; // Or handle this case as you see fit
  }

  const images = data.TokenBalances.TokenBalance.map((tb) => {
    // Check if the nested properties exist
    if (
      tb.tokenNfts &&
      tb.tokenNfts.contentValue &&
      tb.tokenNfts.contentValue.image
    ) {
      return tb.tokenNfts.contentValue.image.small;
    }
    return null;
  }).filter((image) => image !== null); // Filter out any null values

  // Check if images array is empty
  if (images.length === 0) {
    console.error("No images found");
    return null; // Or handle this case as you see fit
  }

  // Select a random image
  const randomImage = images[Math.floor(Math.random() * images.length)];

  const svgImage = await generateImageWithSatori(randomImage);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${svgImage}" />
      <meta property="fc:frame:button:1" content="Ethereum" />
      <meta property="fc:frame:button:2" content="Base" />
      <meta property="fc:frame:button:3" content="Zora" />
      <meta property="fc:frame:post_url" content="${process.env.BASE_URL}/api" />
    </head>
    <body>
      
    </body>
    </html>
  `;
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
