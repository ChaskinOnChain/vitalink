import { NextResponse } from "next/server";
import { BASE_URL, generateFarcasterFrame, validateMessage } from "../utils";

export async function POST(req) {
  const signedMessage = await req.json();

  // Validate the signed message if it exists
  if (signedMessage.trustedData) {
    const isMessageValid = await validateMessage(
      signedMessage.trustedData.messageBytes
    );

    if (!isMessageValid) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }
  }

  const choice = signedMessage.untrustedData.buttonIndex;
  let htmlContent = "";

  // Generate HTML based on the choice
  if (choice === 1) {
    htmlContent = generateFarcasterFrame(`${BASE_URL}/happy.jpg`, choice);
  } else {
    htmlContent = generateFarcasterFrame(`${BASE_URL}/threat.jpg`, choice);
  }

  // Create a new response with HTML content
  const response = new NextResponse(htmlContent, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  });

  return response;
}
