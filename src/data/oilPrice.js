/**
 * Fetch current Brent crude oil price
 * 
 * Tries multiple free sources in order of reliability.
 * Falls back to a hardcoded recent price if all fail.
 * 
 * Note: Free APIs have rate limits and delays (15-60 min).
 * For a production app, consider a paid feed or server-side caching.
 */

const FALLBACK_PRICE = 100;
const CACHE_KEY = 'oil_price_cache';
const CACHE_TTL = 3600000;

function getCached() {
  try {
    const raw = sessionStorage?.getItem(CACHE_KEY);
    if (!raw) return null;
    const { price, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_TTL) return price;
  } catch { /* */ }
  return null;
}

function setCache(price) {
  try { sessionStorage?.setItem(CACHE_KEY, JSON.stringify({ price, timestamp: Date.now() })); } catch { /* */ }
}

export async function fetchOilPrice() {
  const cached = getCached();
  if (cached) return { price: cached, source: 'cached', timestamp: new Date() };

  try {
    const key = import.meta.env.VITE_EIA_API_KEY;
    if (key) {
      const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${key}&frequency=daily&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&length=1`;
      const res = await fetch(url);
      const data = await res.json();
      const price = parseFloat(data?.response?.data?.[0]?.value);
      if (price && price > 30 && price < 300) {
        setCache(price);
        return { price, source: 'EIA (US govt)', timestamp: new Date() };
      }
    }
  } catch { /* continue */ }

  return { price: FALLBACK_PRICE, source: 'fallback', timestamp: new Date() };
}