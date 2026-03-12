/**
 * Fetch current Brent crude oil price
 * 
 * Tries multiple free sources in order of reliability.
 * Falls back to a hardcoded recent price if all fail.
 * 
 * Note: Free APIs have rate limits and delays (15-60 min).
 * For a production app, consider a paid feed or server-side caching.
 */

const FALLBACK_PRICE = 100; // Updated March 12, 2026
const CACHE_KEY = 'oil_price_cache';
const CACHE_TTL = 3600000; // 1 hour in ms

/**
 * Try to get cached price first
 */
function getCached() {
  try {
    const raw = window.sessionStorage?.getItem(CACHE_KEY);
    if (!raw) return null;
    const { price, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_TTL) return price;
  } catch {
    // sessionStorage might not be available
  }
  return null;
}

function setCache(price) {
  try {
    window.sessionStorage?.setItem(CACHE_KEY, JSON.stringify({ price, timestamp: Date.now() }));
  } catch {
    // ignore
  }
}

/**
 * Source 1: commodities-api.com (free tier: 100 calls/month)
 * You'll need to sign up and add your key to .env as VITE_COMMODITIES_API_KEY
 */
async function fetchFromCommoditiesApi() {
  const key = import.meta.env.VITE_COMMODITIES_API_KEY;
  if (!key) return null;

  const res = await fetch(`https://commodities-api.com/api/latest?access_key=${key}&base=USD&symbols=BRENT`);
  const data = await res.json();
  if (data?.data?.rates?.BRENT) {
    // API returns 1/price (how many barrels per USD), so invert
    return 1 / data.data.rates.BRENT;
  }
  return null;
}

/**
 * Source 2: Free proxy via exchangerate/commodity endpoints
 * These come and go — this is a best-effort fallback
 */
async function fetchFromOpenSources() {
  try {
    // Try a CORS-friendly commodity endpoint
    const res = await fetch('https://api.oilpriceapi.com/v1/prices/latest', {
      headers: { 'Authorization': `Token ${import.meta.env.VITE_OILPRICE_API_KEY || ''}` }
    });
    const data = await res.json();
    if (data?.data?.price) return data.data.price;
  } catch {
    // Expected to fail without API key
  }
  return null;
}

/**
 * Main fetch function — tries sources, falls back to hardcoded
 * Returns { price: number, source: string, timestamp: Date }
 */
export async function fetchOilPrice() {
  // Check cache first
  const cached = getCached();
  if (cached) {
    return { price: cached, source: 'cached', timestamp: new Date() };
  }

  // Try API sources
  try {
    const price = await fetchFromCommoditiesApi();
    if (price && price > 30 && price < 300) {
      setCache(price);
      return { price: Math.round(price * 100) / 100, source: 'commodities-api', timestamp: new Date() };
    }
  } catch { /* continue */ }

  try {
    const price = await fetchFromOpenSources();
    if (price && price > 30 && price < 300) {
      setCache(price);
      return { price: Math.round(price * 100) / 100, source: 'oilpriceapi', timestamp: new Date() };
    }
  } catch { /* continue */ }

  // Fallback
  return { price: FALLBACK_PRICE, source: 'fallback', timestamp: new Date() };
}
