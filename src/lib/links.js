// 導航連結。Google Maps 的 universal link 在手機上會直接開啟 App。

export function googleMapsUrl(stop) {
  if (stop.lat == null) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([stop.nameLocal || stop.name, stop.address].filter(Boolean).join(' '))}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`;
}

export function googleDirectionsUrl(stop) {
  const dest = stop.lat != null ? `${stop.lat},${stop.lng}` : encodeURIComponent(stop.nameLocal || stop.name);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=transit`;
}

export function appleMapsUrl(stop) {
  const q = encodeURIComponent(stop.nameLocal || stop.name || '');
  if (stop.lat == null) return `https://maps.apple.com/?q=${q}`;
  return `https://maps.apple.com/?ll=${stop.lat},${stop.lng}&q=${q}`;
}

export function appleDirectionsUrl(stop) {
  const dest = stop.lat != null ? `${stop.lat},${stop.lng}` : encodeURIComponent(stop.nameLocal || stop.name);
  return `https://maps.apple.com/?daddr=${dest}&dirflg=r`;
}

export function openUrl(stop, navApp) {
  return navApp === 'apple' ? appleMapsUrl(stop) : googleMapsUrl(stop);
}

export function directionsUrl(stop, navApp) {
  return navApp === 'apple' ? appleDirectionsUrl(stop) : googleDirectionsUrl(stop);
}
