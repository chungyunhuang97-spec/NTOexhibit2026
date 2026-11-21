// 地點搜尋：Photon（即時聯想）＋ Nominatim（Enter 補查）。
// 兩者都是 OpenStreetMap 資料。Nominatim 使用政策禁止邊打邊搜，所以只在送出時呼叫。
import { SEARCH_BBOX } from './constants';
import { translateQuery, hasCJK } from '../data/aliases';

const PHOTON = 'https://photon.komoot.io/api/';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const ALLOWED = new Set(['DE', 'CZ']);

export function categorize(key, value) {
  const v = value || '';
  if (key === 'tourism' && (v === 'museum' || v === 'gallery')) return 'museum';
  if (key === 'amenity' && v === 'exhibition_centre') return 'exhibition';
  if (key === 'building' && v === 'exhibition_centre') return 'exhibition';
  if (key === 'historic' && (v === 'castle' || v === 'fort' || v === 'palace')) return 'castle';
  if (key === 'tourism' && v === 'viewpoint') return 'viewpoint';
  if (key === 'amenity' && v === 'place_of_worship') return 'church';
  if (key === 'building' && (v === 'church' || v === 'cathedral')) return 'church';
  if (key === 'amenity' && (v === 'restaurant' || v === 'pub' || v === 'biergarten' || v === 'fast_food' || v === 'bar')) return 'food';
  if (key === 'amenity' && v === 'cafe') return 'cafe';
  if (key === 'amenity' && v === 'marketplace') return 'market';
  if (key === 'shop' && (v === 'mall' || v === 'department_store')) return 'shopping';
  if (key === 'shop') return 'shopping';
  if (key === 'railway' || (key === 'public_transport' && v === 'station') || (key === 'building' && v === 'train_station')) return 'station';
  if (key === 'aeroway') return 'airport';
  if (key === 'tourism' && (v === 'hotel' || v === 'hostel' || v === 'apartment' || v === 'guest_house')) return 'hotel';
  if (key === 'leisure' && (v === 'park' || v === 'garden')) return 'park';
  if (key === 'natural' || key === 'waterway') return 'nature';
  if (key === 'highway' && v === 'pedestrian') return 'shopping';
  if (key === 'place' && (v === 'square')) return 'landmark';
  if (key === 'bridge' || v === 'bridge' || key === 'man_made') return 'landmark';
  if (key === 'tourism' || key === 'historic') return 'landmark';
  return 'other';
}

const TYPE_LABEL = {
  museum: '博物館', exhibition: '展覽館', castle: '城堡', viewpoint: '觀景點', church: '教堂',
  food: '餐廳', cafe: '咖啡廳', market: '市集', shopping: '購物', station: '車站', airport: '機場',
  hotel: '住宿', park: '公園', nature: '自然景觀', landmark: '地標', other: '地點'
};

function placeTypeLabel(key, value, cat) {
  if (key === 'place') {
    return { city: '城市', town: '城鎮', village: '村莊', suburb: '城區', square: '廣場', neighbourhood: '街區', quarter: '街區' }[value] || '地區';
  }
  if (key === 'highway') return value === 'pedestrian' ? '步行街' : '街道';
  if (key === 'shop') {
    return { mall: '購物中心', department_store: '百貨公司', chemist: '藥妝店', clothes: '服飾店', supermarket: '超市', outlet: '暢貨中心' }[value] || '商店';
  }
  return TYPE_LABEL[cat];
}

function countryName(cc) {
  return { DE: '德國', CZ: '捷克' }[cc] || '';
}

function fromPhoton(f) {
  const p = f.properties || {};
  const [lng, lat] = f.geometry.coordinates;
  const cc = (p.countrycode || '').toUpperCase();
  const cat = categorize(p.osm_key, p.osm_value);
  const street = [p.street, p.housenumber].filter(Boolean).join(' ');
  const cityLine = [p.postcode, p.city || p.town || p.village || p.county].filter(Boolean).join(' ');
  const address = [street, cityLine, countryName(cc)].filter(Boolean).join(', ');
  return {
    key: `photon-${p.osm_type}-${p.osm_id}`,
    osmId: p.osm_type && p.osm_id ? `${p.osm_type}${p.osm_id}` : null,
    nameLocal: p.name || street || p.city || '',
    nameZh: null,
    address,
    lat,
    lng,
    category: cat,
    typeLabel: placeTypeLabel(p.osm_key, p.osm_value, cat),
    country: cc
  };
}

function fromNominatim(r) {
  const a = r.address || {};
  const nd = r.namedetails || {};
  const cc = (a.country_code || '').toUpperCase();
  const cat = categorize(r.category, r.type);
  const street = [a.road || a.pedestrian || a.square, a.house_number].filter(Boolean).join(' ');
  const cityLine = [a.postcode, a.city || a.town || a.village || a.municipality].filter(Boolean).join(' ');
  const zh = nd['name:zh-Hant'] || nd['name:zh-TW'] || nd['name:zh'] || null;
  const local = nd.name || r.name || '';
  return {
    key: `nom-${r.osm_type}-${r.osm_id}`,
    osmId: r.osm_type && r.osm_id ? `${r.osm_type[0].toUpperCase()}${r.osm_id}` : null,
    nameLocal: local,
    nameZh: zh && zh !== local ? zh : null,
    address: [street, cityLine, countryName(cc)].filter(Boolean).join(', ') || r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
    category: cat,
    typeLabel: placeTypeLabel(r.category, r.type, cat),
    country: cc
  };
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((r) => {
    const k = `${r.nameLocal}|${r.lat.toFixed(3)}|${r.lng.toFixed(3)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** 即時聯想（Photon）。bias：目前城市中心 [lng, lat] */
export async function suggest(q, { bias, signal } = {}) {
  const { query, zh } = translateQuery(q);
  const params = new URLSearchParams({ q: query, limit: '12', bbox: SEARCH_BBOX.join(',') });
  if (!hasCJK(query)) params.set('lang', 'de');
  if (bias) {
    params.set('lon', String(bias[0]));
    params.set('lat', String(bias[1]));
    params.set('location_bias_scale', '0.3');
  }
  const res = await fetch(`${PHOTON}?${params}`, { signal });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  const list = dedupe((data.features || []).map(fromPhoton).filter((r) => ALLOWED.has(r.country)));
  return list.slice(0, 8).map((r, i) => ({ ...r, nameZh: i === 0 && zh ? zh : r.nameZh }));
}

/** 送出搜尋（Nominatim），支援中文名稱比對 */
export async function searchFull(q, { signal } = {}) {
  const { query, zh } = translateQuery(q);
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    countrycodes: 'de,cz',
    viewbox: `${SEARCH_BBOX[0]},${SEARCH_BBOX[3]},${SEARCH_BBOX[2]},${SEARCH_BBOX[1]}`,
    bounded: '1',
    addressdetails: '1',
    namedetails: '1',
    limit: '8',
    'accept-language': 'zh-TW,zh,de'
  });
  const res = await fetch(`${NOMINATIM}?${params}`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  return dedupe(data.map(fromNominatim)).map((r, i) => ({ ...r, nameZh: r.nameZh || (i === 0 ? zh : null) }));
}

/** 由座標反查地址（Google Maps 連結匯入時使用，單次呼叫） */
export async function reverse(lat, lng, { signal } = {}) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
    namedetails: '1',
    zoom: '18',
    'accept-language': 'de'
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const r = await res.json();
  if (!r || r.error) return null;
  return fromNominatim(r);
}

/** 把 Google Maps 連結轉成搜尋結果 */
export async function fromGoogleLink(parsed, { signal } = {}) {
  if (parsed.lat == null) {
    // 只有名稱：用名稱搜尋
    const list = await searchFull(parsed.name, { signal });
    return list.slice(0, 5);
  }
  let rev = null;
  try {
    rev = await reverse(parsed.lat, parsed.lng, { signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
  }
  return [
    {
      key: `gmaps-${parsed.lat}-${parsed.lng}`,
      osmId: null,
      nameLocal: parsed.name || rev?.nameLocal || '未命名地點',
      nameZh: null,
      address: rev?.address || '',
      lat: parsed.lat,
      lng: parsed.lng,
      category: rev?.category && rev.category !== 'other' ? rev.category : 'landmark',
      typeLabel: '來自 Google Maps 連結',
      country: rev?.country || ''
    }
  ];
}
