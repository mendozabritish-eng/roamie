// Vercel serverless function: /api/news?lat=..&lng=.. OR /api/news?q=<place name>
// Resolves the location to a locality (city/town) and country — from GPS
// coordinates (reverse geocode) or a typed place name (forward geocode).
// From the country it derives the local language, then searches GNews for
// news naming that place in BOTH the local language and English, merged:
// safety-relevant results first (closures, weather, emergencies), then local
// happenings (parades, festivals). Each article is tagged with its language
// so the client can badge non-English items. Falls back to country-wide top
// headlines only for the GPS path when nothing locality-specific is found.
// Keeps GNEWS_API_KEY server-side.

// country code -> primary local language (GNews-supported languages only)
const COUNTRY_LANG = {
  fr:"fr", be:"fr", ch:"de", at:"de", de:"de", li:"de",
  it:"it", es:"es", mx:"es", ar:"es", cl:"es", co:"es", pe:"es", ve:"es",
  pt:"pt", br:"pt", nl:"nl", ru:"ru", ua:"uk", jp:"ja", cn:"zh", tw:"zh",
  gr:"el", il:"he", in:"hi", sa:"ar", ae:"ar", eg:"ar", ma:"ar", qa:"ar",
  se:"sv", no:"no", ro:"ro",
};

function langForCountry(country) {
  if (!country) return "en";
  return COUNTRY_LANG[country.toLowerCase()] || "en";
}

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

  try {
    if (manualSearch) {
      locality = q.trim();
      // Forward-geocode the typed name to get a country so we can pick a
      // local language too (best effort; falls back to English if it fails).
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locality)}&limit=1&addressdetails=1`,
          { headers: { "User-Agent": "rhomie-app/1.0" } }
        );
        const geoData = await geoRes.json();
        if (geoData?.[0]?.address?.country_code) country = geoData[0].address.country_code;
      } catch (err) {
        console.error("forward geocode failed:", err);
      }
    } else if (lat && lng) {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`,
        { headers: { "User-Agent": "rhomie-app/1.0" } }
      );
      const geoData = await geoRes.json();
      const addr = geoData?.address;
      if (addr?.country_code) country = addr.country_code;
      locality = addr?.city || addr?.town || addr?.village || addr?.municipality || addr?.county || null;
    }
  } catch (err) {
    console.error("geocode failed:", err);
  }

  const localLang = langForCountry(country);

  async function searchGNews(query, lang) {
    const params = new URLSearchParams({ q: query, lang, sortby: "publishedAt", max: "10", apikey: apiKey });
    if (country) params.set("country", country);
    const newsRes = await fetch(`https://gnews.io/api/v4/search?${params.toString()}`);
    if (!newsRes.ok) throw new Error(`GNews search ${newsRes.status}`);
    return newsRes.json();
  }

  async function fetchTopHeadlines() {
    const newsRes = await fetch(
      `https://gnews.io/api/v4/top-headlines?category=general&lang=${localLang}&country=${encodeURIComponent(country || "us")}&max=10&apikey=${apiKey}`
    );
    if (!newsRes.ok) throw new Error(`GNews top-headlines ${newsRes.status}`);
    return newsRes.json();
  }

  const SAFETY_TERMS = "riot OR unrest OR emergency OR evacuation OR evacuate OR shooting OR curfew OR disaster OR earthquake OR hurricane OR wildfire OR flood OR terror OR \"state of emergency\"";

  try {
    // Build the search passes. English safety search first (SAFETY_TERMS are
    // English keywords), then locality news in the local language, then in
    // English. When the local language IS English, the local-language pass is
    // the same as the English pass, so skip it.
    const passes = [
      { key: "safety", lang: "en", query: `"${locality}" AND (${SAFETY_TERMS})` },
    ];
    if (localLang !== "en") passes.push({ key: "local", lang: localLang, query: `"${locality}"` });
    passes.push({ key: "en", lang: "en", query: `"${locality}"` });

    let results = [];
    if (locality) {
      const settled = await Promise.allSettled(passes.map(p => searchGNews(p.query, p.lang)));
      results = settled.map((s, i) => {
        if (s.status === "fulfilled") return { lang: passes[i].lang, articles: s.value.articles || [] };
        console.error(`GNews ${passes[i].key} search failed:`, s.reason);
        return { lang: passes[i].lang, articles: [] };
      });
    }

    // Merge in pass order (safety, local-language, english), tagging each
    // article with the language of the pass it came from, deduped by url.
    const seen = new Set();
    const merged = [];
    for (const { lang, articles } of results) {
      for (const a of articles) {
        if (!a.url || seen.has(a.url)) continue;
        seen.add(a.url);
        merged.push({ ...a, _lang: lang });
        if (merged.length >= 20) break;
      }
      if (merged.length >= 20) break;
    }

    let articlesSource = merged;
    if (!articlesSource.length && !manualSearch) {
      const headlines = await fetchTopHeadlines();
      articlesSource = (headlines.articles || []).map(a => ({ ...a, _lang: localLang }));
    }

    const articles = articlesSource.map((a, i) => ({
      id: i,
      title: a.title,
      source: a.source?.name || "News",
      publishedAt: a.publishedAt,
      url: a.url,
      lang: a._lang || "en",
    }));
    res.status(200).json({ country, locality, localLang, articles });
  } catch (err) {
    console.error("news fetch failed:", err);
    res.status(502).json({ error: "Could not fetch news right now." });
  }
}
