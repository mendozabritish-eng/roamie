// Vercel serverless function: /api/news?lat=..&lng=..
// Reverse-geocodes the given coordinates to a specific locality (city/town),
// then searches GNews for news naming that place — both safety-relevant
// (closures, weather, emergencies) and local happenings (parades, festivals).
// Falls back to country-wide top headlines if no locality-specific results.
// Keeps GNEWS_API_KEY server-side.
export default async function handler(req, res) {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "News service is not configured." });
    return;
  }

  const { lat, lng } = req.query;
  let country = "us";
  let locality = null;

  if (lat && lng) {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`,
        { headers: { "User-Agent": "rhomie-app/1.0" } }
      );
      const geoData = await geoRes.json();
      const addr = geoData?.address;
      if (addr?.country_code) country = addr.country_code;
      locality = addr?.city || addr?.town || addr?.village || addr?.municipality || addr?.county || null;
    } catch (err) {
      console.error("reverse geocode failed:", err);
      // fall back to defaults
    }
  }

  async function fetchTopHeadlines() {
    const newsRes = await fetch(
      `https://gnews.io/api/v4/top-headlines?category=general&lang=en&country=${encodeURIComponent(country)}&max=10&apikey=${apiKey}`
    );
    if (!newsRes.ok) throw new Error(`GNews top-headlines ${newsRes.status}`);
    return newsRes.json();
  }

  async function fetchLocalSearch() {
    const q = `"${locality}"`;
    const newsRes = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&country=${encodeURIComponent(country)}&sortby=publishedAt&max=10&apikey=${apiKey}`
    );
    if (!newsRes.ok) throw new Error(`GNews search ${newsRes.status}`);
    return newsRes.json();
  }

  try {
    let newsData = { articles: [] };
    if (locality) {
      try {
        newsData = await fetchLocalSearch();
      } catch (err) {
        console.error("GNews local search failed, falling back:", err);
      }
    }
    if (!newsData.articles?.length) {
      newsData = await fetchTopHeadlines();
    }

    const articles = (newsData.articles || []).map((a, i) => ({
      id: i,
      title: a.title,
      source: a.source?.name || "News",
      publishedAt: a.publishedAt,
      url: a.url,
    }));
    res.status(200).json({ country, locality, articles });
  } catch (err) {
    console.error("news fetch failed:", err);
    res.status(502).json({ error: "Could not fetch news right now." });
  }
}
