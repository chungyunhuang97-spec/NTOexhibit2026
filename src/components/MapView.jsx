import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CITIES } from '../lib/constants';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';

/**
 * points: [{ id, lat, lng, label, color, dim }]
 * mode: 'day' 顯示編號標記與路線；'overview' 顯示小圓點
 * hotel: { lat, lng, name } | null
 * focus: { lat, lng, zoom, key } 變更時 flyTo
 * padding: 地圖可視區內距（手機版扣掉抽屜高度）
 */
export default function MapView({ points, mode = 'day', hotel, selectedId, onSelect, focus, padding }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const readyRef = useRef(false);
  const fitKeyRef = useRef('');
  const latest = useRef({ points, mode, hotel, selectedId, onSelect, padding });
  latest.current = { points, mode, hotel, selectedId, onSelect, padding };

  useEffect(() => {
    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      center: CITIES.FRA.center,
      zoom: 5.4,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'top-right');
    map.on('load', () => {
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#1E2124', 'line-width': 1.5, 'line-opacity': 0.55, 'line-dasharray': [2, 2] }
      });
      readyRef.current = true;
      render();
    });
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function render() {
    const map = mapRef.current;
    if (!map) return;
    const { points, mode, hotel, selectedId, onSelect } = latest.current;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const valid = points.filter((p) => p.lat != null && p.lng != null);
    valid.forEach((p) => {
      // 外層交給 MapLibre 定位，內層負責樣式（避免覆蓋定位用的 transform）
      const el = document.createElement('div');
      const inner = document.createElement('div');
      el.appendChild(inner);
      inner.style.background = p.color;
      if (mode === 'overview') {
        inner.className = 'mk-small';
      } else {
        inner.className = `mk${p.id === selectedId ? ' sel' : ''}${p.dim ? ' dim' : ''}`;
        inner.textContent = p.label ?? '';
      }
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', p.title || '');
      el.title = p.title || '';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect?.(p.id);
      });
      const m = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
      markersRef.current.push(m);
    });

    if (hotel?.lat != null && mode === 'day') {
      const el = document.createElement('div');
      el.className = 'mk-hotel';
      el.title = hotel.name;
      el.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>';
      markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([hotel.lng, hotel.lat]).addTo(map));
    }

    if (readyRef.current) {
      const line = mode === 'day' ? valid.filter((p) => !p.dim).map((p) => [p.lng, p.lat]) : [];
      map.getSource('route')?.setData({
        type: 'FeatureCollection',
        features: line.length > 1 ? [{ type: 'Feature', geometry: { type: 'LineString', coordinates: line } }] : []
      });
    }
  }

  // 重新繪製標記
  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, mode, hotel, selectedId]);

  // 換日或換模式時自動縮放到全部標記
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const valid = points.filter((p) => p.lat != null && !p.dim);
    const all = hotel?.lat != null && mode === 'day' ? [...valid, hotel] : valid;
    const key = `${mode}|${all.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join(';')}`;
    if (key === fitKeyRef.current) return;
    fitKeyRef.current = key;
    if (!all.length) return;
    const pad = { top: 60, bottom: 40, left: 40, right: 40, ...(padding || {}) };
    if (all.length === 1) {
      map.flyTo({ center: [all[0].lng, all[0].lat], zoom: 14, padding: pad, duration: 900 });
      return;
    }
    const b = new maplibregl.LngLatBounds();
    all.forEach((p) => b.extend([p.lng, p.lat]));
    map.fitBounds(b, { padding: pad, maxZoom: 15, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, mode, hotel]);

  // 指定飛行
  useEffect(() => {
    if (!focus || focus.lat == null || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [focus.lng, focus.lat],
      zoom: focus.zoom || 15.5,
      padding: { top: 60, bottom: 40, left: 40, right: 40, ...(latest.current.padding || {}) },
      duration: 1100,
      essential: true
    });
  }, [focus]);

  return (
    <>
      <div ref={ref} className="map" />
      {mode === 'overview' && (
        <div className="map-legend">
          {['FRA', 'MUC', 'PRG'].map((c) => (
            <span key={c} className="row" style={{ gap: 6 }}>
              <i className="city-dot" style={{ background: CITIES[c].color }} />
              {CITIES[c].name}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
