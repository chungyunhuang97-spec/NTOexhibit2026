// 天氣：Open-Meteo（免費、免金鑰），只在出發前 16 天內有預報
const cache = new Map();

const CODE = (c) => {
  if (c == null) return '';
  if (c === 0) return '晴';
  if (c <= 2) return '晴時多雲';
  if (c === 3) return '陰';
  if (c <= 48) return '霧';
  if (c <= 57) return '毛毛雨';
  if (c <= 67) return '雨';
  if (c <= 77) return '雪';
  if (c <= 82) return '陣雨';
  if (c <= 86) return '陣雪';
  return '雷雨';
};

export async function forecast(date, [lng, lat]) {
  const diff = (new Date(date) - new Date()) / 86400000;
  if (diff > 15 || diff < -1) return null;
  const key = `${date}|${lat}|${lng}`;
  if (cache.has(key)) return cache.get(key);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${date}&end_date=${date}`;
  const p = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d?.daily) return null;
      return {
        hi: Math.round(d.daily.temperature_2m_max[0]),
        lo: Math.round(d.daily.temperature_2m_min[0]),
        rain: d.daily.precipitation_probability_max[0],
        text: CODE(d.daily.weather_code[0]),
        snow: [71, 73, 75, 77, 85, 86].includes(d.daily.weather_code[0])
      };
    })
    .catch(() => null);
  cache.set(key, p);
  return p;
}
