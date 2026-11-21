// 導航連結。Google Maps 的 universal link 在手機上會直接開啟 App。
// 用「當地原名 + 地址」查詢，Google 會對應到實際的地標頁面（名稱、評價、營業時間），
// 而不是只有經緯度的座標圖釘。沒有名稱時才退回經緯度。

const COUNTRY = { 德國: 'Deutschland', 捷克: 'Česko' };

/** 給 Google / Apple 查詢用的文字：原名 + 地址（國名換成當地寫法） */
export function placeQuery(stop) {
  const name = (stop.nameLocal || stop.name || '').trim();
  let address = (stop.address || '').trim();
  Object.entries(COUNTRY).forEach(([zh, local]) => {
    address = address.replace(new RegExp(`${zh}$`), local);
  });
  // 地址開頭若已包含名稱（例如廣場、街道），就不重複
  if (name && address.toLowerCase().startsWith(name.toLowerCase())) return address;
  return [name, address].filter(Boolean).join(', ');
}

const coords = (stop) => (stop.lat != null && stop.lng != null ? `${stop.lat},${stop.lng}` : null);

export function googleMapsUrl(stop) {
  const q = placeQuery(stop) || coords(stop) || '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function googleDirectionsUrl(stop) {
  const dest = placeQuery(stop) || coords(stop) || '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=transit`;
}

export function googleSearchUrl(text) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
}

export function appleMapsUrl(stop) {
  const q = encodeURIComponent(placeQuery(stop) || stop.name || '');
  const ll = coords(stop);
  return ll ? `https://maps.apple.com/?q=${q}&ll=${ll}` : `https://maps.apple.com/?q=${q}`;
}

export function appleDirectionsUrl(stop) {
  const dest = placeQuery(stop) || coords(stop) || '';
  return `https://maps.apple.com/?daddr=${encodeURIComponent(dest)}&dirflg=r`;
}

export function openUrl(stop, navApp) {
  return navApp === 'apple' ? appleMapsUrl(stop) : googleMapsUrl(stop);
}

export function directionsUrl(stop, navApp) {
  return navApp === 'apple' ? appleDirectionsUrl(stop) : googleDirectionsUrl(stop);
}

/**
 * 解析 Google Maps 網址（電腦瀏覽器網址列的完整連結）。
 * 支援 /maps/place/名稱/@lat,lng 與 !3d…!4d… 以及 ?q=lat,lng。
 * 回傳 { name, lat, lng } 或 { short: true }（短網址無法解析）或 null。
 */
export function parseGoogleMapsUrl(text) {
  const t = text.trim();
  if (!/^https?:\/\//i.test(t)) return null;
  let url;
  try {
    url = new URL(t);
  } catch {
    return null;
  }
  const host = url.hostname;
  if (/(^|\.)maps\.app\.goo\.gl$|(^|\.)goo\.gl$/.test(host)) return { short: true };
  if (!/google\./.test(host)) return null;
  const path = decodeURIComponent(url.pathname);
  let name = null;
  const m = path.match(/\/maps\/place\/([^/]+)/);
  if (m) name = m[1].replace(/\+/g, ' ').trim();
  let lat = null;
  let lng = null;
  const pin = t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const at = t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const q = url.searchParams.get('q') || url.searchParams.get('query');
  const qll = q && q.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
  if (pin) [lat, lng] = [Number(pin[1]), Number(pin[2])];
  else if (qll) [lat, lng] = [Number(qll[1]), Number(qll[2])];
  else if (at) [lat, lng] = [Number(at[1]), Number(at[2])];
  if (!name && q && !qll) name = q.trim();
  if (lat == null && !name) return null;
  return { name, lat, lng };
}
