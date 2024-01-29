import { NextResponse } from "next/server";
import { generateFarcasterFrame, validateMessage } from "../utils";
// hi
export async function POST(req) {
  try {
    const signedMessage = await req.json();
    const fid = signedMessage?.untrustedData?.fid;

    // Validate the signed message if it exists
    if (signedMessage.trustedData) {
      const isMessageValid = await validateMessage(
        signedMessage.trustedData.messageBytes
      );

      if (!isMessageValid) {
        console.error("Invalid message");
        return NextResponse.json({ error: "Invalid message" }, { status: 400 });
      }
    }
    let htmlContent = "";

    await generateFarcasterFrame(fid);

    // Generate HTML based on the choice
    // htmlContent = await generateFarcasterFrame(fid);
    // console.log("Generated HTML content:", htmlContent);

    const response = new NextResponse("Yup", {
      status: 200,
    });

    // Create a new response with HTML content
    // const response = new NextResponse(htmlContent, {
    //   status: 200,
    //   headers: {
    //     "Content-Type": "text/html",
    //   },
    // });

    return response;
  } catch (error) {
    console.error("Error in POST function:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
