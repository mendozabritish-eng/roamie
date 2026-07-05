// Vercel serverless function: /api/news?lat=..&lng=..
// Reverse-geocodes the given coordinates to a country, then fetches real
// headlines for that country from GNews. Keeps GNEWS_API_KEY server-side.
export default async function handler(req, res) {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "News service is not configured." });
    return;
  }

  const { lat, lng } = req.query;
  let country = "us";

  if (lat && lng) {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=3`,
        { headers: { "User-Agent": "rhomie-app/1.0" } }
      );
      const geoData = await geoRes.json();
      if (geoData?.address?.country_code) {
        country = geoData.address.country_code;
      }
    } catch (err) {
      console.error("reverse geocode failed:", err);
      // fall back to default country
    }
  }

  try {
    const newsRes = await fetch(
      `https://gnews.io/api/v4/top-headlines?category=general&lang=en&country=${encodeURIComponent(country)}&max=10&apikey=${apiKey}`
    );
    if (!newsRes.ok) {
      const body = await newsRes.text();
      console.error("GNews error:", newsRes.status, body);
      res.status(502).json({ error: "Could not fetch news right now." });
      return;
    }
    const newsData = await newsRes.json();
    const articles = (newsData.articles || []).map((a, i) => ({
      id: i,
      title: a.title,
      source: a.source?.name || "News",
      publishedAt: a.publishedAt,
      url: a.url,
    }));
    res.status(200).json({ country, articles });
  } catch (err) {
    console.error("news fetch failed:", err);
    res.status(502).json({ error: "Could not fetch news right now." });
  }
}
