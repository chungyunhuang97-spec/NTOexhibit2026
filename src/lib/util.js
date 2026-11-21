import { WEEKDAYS, OUTDOOR_START, OUTDOOR_END, CITIES } from './constants';

export const uid = (prefix = 'x') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function weekday(iso) {
  return parseDate(iso).getUTCDay();
}

export function fmtDate(iso, { withWeekday = true } = {}) {
  const d = parseDate(iso);
  const s = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return withWeekday ? `${s}（${WEEKDAYS[d.getUTCDay()]}）` : s;
}

export function toMin(t) {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function fromMin(min) {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function endTime(start, duration) {
  const s = toMin(start);
  if (s == null || !duration) return null;
  return fromMin(s + Number(duration));
}

export function fmtDuration(min) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} 分`;
  return m ? `${h} 小時 ${m} 分` : `${h} 小時`;
}

/** 戶外景點是否落在冬季建議時段之外 */
export function outdoorWarning(stop) {
  if (!stop.outdoor || !stop.time) return false;
  const s = toMin(stop.time);
  const e = s + (Number(stop.duration) || 0);
  return s < toMin(OUTDOOR_START) || e > toMin(OUTDOOR_END);
}

/** 德國週日購物提醒 */
export function sundayWarning(stop, day) {
  if (!day) return false;
  const city = CITIES[day.city];
  return weekday(day.date) === 0 && city?.country === 'DE' && (stop.category === 'shopping' || stop.category === 'market');
}

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 景點間移動估算（直線距離 × 1.3 的步行估計） */
export function moveHint(a, b) {
  if (a?.lat == null || b?.lat == null) return null;
  const km = haversineKm(a, b) * 1.3;
  if (km < 0.15) return { text: '就在附近', mode: 'walk' };
  if (km <= 1.8) return { text: `步行約 ${Math.max(2, Math.round((km / 4.5) * 60))} 分`, mode: 'walk' };
  if (km <= 25) return { text: `約 ${km.toFixed(1)} km・建議搭大眾運輸`, mode: 'transit' };
  return { text: `約 ${Math.round(km)} km・需搭火車或巴士`, mode: 'far' };
}

/** 日出日落（NOAA 簡化公式），回傳當地時間 HH:MM */
export function sunTimes(iso, lat, lng, tz) {
  const d = parseDate(iso);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const n = Math.floor((d - start) / 86400000);
  const rad = Math.PI / 180;
  const gamma = ((2 * Math.PI) / 365) * (n - 1);
  const eqtime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const ha = Math.acos(
    Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl)
  ) / rad;
  const toLocal = (utcMin) => {
    const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + utcMin * 60000);
    return new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(dt);
  };
  return {
    sunrise: toLocal(720 - 4 * (lng + ha) - eqtime),
    sunset: toLocal(720 - 4 * (lng - ha) - eqtime)
  };
}

export function nowIn(tz) {
  return new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date());
}

export function money(amount, currency) {
  if (amount == null || amount === '') return '';
  const n = Number(amount);
  if (Number.isNaN(n)) return '';
  const sym = { EUR: '€', CZK: 'Kč ', TWD: 'NT$' }[currency] || '';
  return currency === 'CZK' ? `${n.toLocaleString('zh-TW')} Kč` : `${sym}${n.toLocaleString('zh-TW')}`;
}

export function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}
