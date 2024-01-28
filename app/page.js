export async function generateMetadata() {
  return {
    title: "Soup test",
    description: "Soup event",
    openGraph: {
      title: "Eventcaster RSVP test",
      images: "question.jpg",
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": "question.jpg",
      "fc:frame:button:1": "Yes",
      "fc:frame:button:2": "No",
      "fc:frame:post_url": "/api",
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
