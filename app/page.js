export async function generateMetadata() {
  return {
    title: "Random Ethereum",
    description: "Random Ethereum NFT",
    openGraph: {
      title: "Random Ethereum",
      images: `${process.env.BASE_URL}/ethereum.svg`,
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${process.env.BASE_URL}/ethereum.svg`,
      "fc:frame:button:1": "Ethereum",
      "fc:frame:button:2": "Base",
      "fc:frame:button:3": "Zora",
      "fc:frame:post_url": `${process.env.BASE_URL}/api`,
    },
    metadataBase: new URL(process.env.BASE_URL ?? ""),
  };
}
// hi
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24"></main>
  );
}
