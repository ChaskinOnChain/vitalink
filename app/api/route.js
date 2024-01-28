import { NextResponse } from "next/server";
import { generateFarcasterFrame, validateMessage } from "../utils";

export async function POST(req) {
  console.log("POST request received");

  try {
    const signedMessage = await req.json();
    console.log("Signed Message:", signedMessage);

    // Validate the signed message if it exists
    if (signedMessage.trustedData) {
      console.log("Validating trusted data");
      const isMessageValid = await validateMessage(
        signedMessage.trustedData.messageBytes
      );
      console.log("Is message valid:", isMessageValid);

      if (!isMessageValid) {
        console.error("Invalid message");
        return NextResponse.json({ error: "Invalid message" }, { status: 400 });
      }
    }

    const choice = signedMessage.untrustedData.buttonIndex;
    console.log("Choice from untrusted data:", choice);

    let htmlContent = "";

    // Generate HTML based on the choice
    if (choice === 1) {
      htmlContent = generateFarcasterFrame(
        `${process.env.BASE_URL}/happy.jpg`,
        choice
      );
    } else {
      htmlContent = generateFarcasterFrame(
        `${process.env.BASE_URL}/threat.jpg`,
        choice
      );
    }
    console.log("Generated HTML content:", htmlContent);

    // Create a new response with HTML content
    const response = new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });

    return response;
  } catch (error) {
    console.error("Error in POST function:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
