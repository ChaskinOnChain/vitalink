export async function generateMetadata() {
  return {
    title: "Random Ethereum",
    description: "Random Ethereum NFT",
    openGraph: {
      title: "Random Ethereum",
      images: `${process.env.BASE_URL}/main_image/ethereum_nft.svg`,
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${process.env.BASE_URL}/main_image/ethereum_nft.svg`,
      "fc:frame:button:1": "Generate Random Ethereum NFT",
      "fc:frame:post_url": `${process.env.BASE_URL}/api`,
    },
    metadataBase: new URL(process.env.BASE_URL ?? ""),
  };
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24"></main>
  );
}
