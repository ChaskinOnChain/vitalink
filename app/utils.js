import { getHubRpcClient, Message } from "@farcaster/hub-web";
import { NextResponse } from "next/server";
import { init, fetchQuery } from "@airstack/node";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dp9p4tjtu",
  api_key: "397974283734572",
  api_secret: process.env.CLOUD,
});

export const BASE_URL = process.env.BASE_URL;

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

  // Filter the images to exclude .gif files
  const nonGifImages = data.TokenBalances.TokenBalance.map((tb) => {
    if (
      tb.tokenNfts &&
      tb.tokenNfts.contentValue &&
      tb.tokenNfts.contentValue.image &&
      !tb.tokenNfts.contentValue.image.small.endsWith(".gif")
    ) {
      // Exclude .gif images
      return tb.tokenNfts.contentValue.image.small;
    }
    return null;
  }).filter((image) => image !== null);

  // Check if the filtered images array is empty
  if (nonGifImages.length === 0) {
    console.error("No suitable images found");
    return null;
  }

  // Select a random image
  const randomImage =
    nonGifImages[Math.floor(Math.random() * nonGifImages.length)];

  // Log the selected random image URL
  console.log("Random Image URL:", randomImage);

  // Encode the randomImage URL
  const encodedRandomImageUrl = encodeURIComponent(randomImage);

  // Construct the Cloudinary URL for the fetched image with transformations
  const transformedImageUrl = cloudinary.url(encodedRandomImageUrl, {
    type: "fetch",
    transformation: [
      { width: 1910, aspect_ratio: "1.91:1", crop: "fill" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  // Log the transformed image URL
  console.log("Transformed Image URL:", transformedImageUrl);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${transformedImageUrl}" />
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
