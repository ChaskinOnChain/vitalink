export async function generateMetadata() {
  return {
    title: "Eventcaster RSVP test",
    description: "Test event",
    other: (
      <>
        <meta property="og:title" content="Frame" />
        <meta property="og:image" content={`${BASE_URL}/question.jpg`} />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${BASE_URL}/question.jpg`} />
        <meta property="fc:frame:button:1" content="Yes" />
        <meta property="fc:frame:button:2" content="No" />
        <meta property="fc:frame:post_url" content={`${BASE_URL}/api/post`} />
      </>
    ),
  };
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      testing
    </main>
  );
}
