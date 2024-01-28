export async function generateMetadata() {
  return {
    title: "Soup test",
    description: "Soup event",
    openGraph: {
      title: "Eventcaster RSVP test",
      images: [`${process.env.BASE_URL}/question.jpg`],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${process.env.BASE_URL}/question.jpg`,
      "fc:frame:button:1": "Yes",
      "fc:frame:button:2": "No",
      "fc:frame:post_url": `${process.env.BASE_URL}/api/answer`,
    },
    metadataBase: new URL(process.env.BASE_URL ?? ""),
  };
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      testing
    </main>
  );
}
