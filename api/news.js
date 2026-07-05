// Vercel serverless function: /api/news?lat=..&lng=.. OR /api/news?q=<place name>
// Given coordinates, reverse-geocodes to a specific locality (city/town) and
// country. Given a manually-typed place name (q), searches globally by name
// instead (no reliable country code for free text). Either way, searches
// GNews for news naming that place — both safety-relevant (closures,
// weather, emergencies) and local happenings (parades, festivals). The GPS
// path falls back to country-wide top headlines if nothing local is found;
// the manual-search path does not, so an empty result is shown honestly as
// "no news found" rather than unrelated country headlines.
// Keeps GNEWS_API_KEY server-side.
export default async function handler(req, res) {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "News service is not configured." });
    return;
  }

  const { lat, lng, q } = req.query;
  const manualSearch = !!q?.trim();
  let country = null;
  let locality = null;

  if (manualSearch) {
    locality = q.trim();
  } else if (lat && lng) {
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
      `https://gnews.io/api/v4/top-headlines?category=general&lang=en&country=${encodeURIComponent(country || "us")}&max=10&apikey=${apiKey}`
    );
    if (!newsRes.ok) throw new Error(`GNews top-headlines ${newsRes.status}`);
    return newsRes.json();
  }

  async function searchGNews(query) {
    const params = new URLSearchParams({ q: query, lang: "en", sortby: "publishedAt", max: "10", apikey: apiKey });
    if (country) params.set("country", country);
    const newsRes = await fetch(`https://gnews.io/api/v4/search?${params.toString()}`);
    if (!newsRes.ok) throw new Error(`GNews search ${newsRes.status}`);
    return newsRes.json();
  }

  const SAFETY_TERMS = "riot OR unrest OR emergency OR evacuation OR evacuate OR shooting OR curfew OR disaster OR earthquake OR hurricane OR wildfire OR flood OR terror OR \"state of emergency\"";

  try {
    let safetyArticles = [];
    let localArticles = [];

    if (locality) {
      const [safetyResult, localResult] = await Promise.allSettled([
        searchGNews(`"${locality}" AND (${SAFETY_TERMS})`),
        searchGNews(`"${locality}"`),
      ]);
      if (safetyResult.status === "fulfilled") safetyArticles = safetyResult.value.articles || [];
      else console.error("GNews safety search failed:", safetyResult.reason);
      if (localResult.status === "fulfilled") localArticles = localResult.value.articles || [];
      else console.error("GNews local search failed:", localResult.reason);
    }

    // Merge, putting safety-relevant articles first, deduped by url, capped at 15
    const seen = new Set();
    const merged = [];
    for (const a of [...safetyArticles, ...localArticles]) {
      if (!a.url || seen.has(a.url)) continue;
      seen.add(a.url);
      merged.push(a);
      if (merged.length >= 15) break;
    }

    let articlesSource = merged;
    if (!articlesSource.length && !manualSearch) {
      const headlines = await fetchTopHeadlines();
      articlesSource = headlines.articles || [];
    }

    const articles = articlesSource.map((a, i) => ({
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
