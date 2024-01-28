import Head from "next/head";
import { Inter } from "next/font/google";
import "./globals.css";
import { BASE_URL } from "./utils";

const inter = Inter({ subsets: ["latin"] });

const metaTags = (
  <>
    <meta property="og:title" content="Frame" />
    <meta property="og:image" content={`${BASE_URL}/question.jpg`} />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content={`${BASE_URL}/question.jpg`} />
    <meta property="fc:frame:button:1" content="Yes" />
    <meta property="fc:frame:button:2" content="No" />
    <meta property="fc:frame:post_url" content={`${BASE_URL}/api/post`} />
  </>
);

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        {metaTags}
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
