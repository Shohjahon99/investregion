import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let geoCache = null;
export function loadGeo() {
  if (!geoCache) {
    const base = import.meta.env.BASE_URL;
    geoCache = Promise.all([fetch(base + 'geo/districts.geojson').then((r) => r.json()), fetch(base + 'geo/regions.geojson').then((r) => r.json())]);
  }
  return geoCache;
}

const OFFER_COLOR = { project: '#2563eb', land: '#16a34a', building: '#9333ea' };

// Tumanlar kesimidagi interaktiv xarita
export default function MapView({ colorFn, tooltipFn, onClick, selected, markers, onMarker, focus, height = 560, highlight }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), mLayer = useRef(null), byId = useRef({}), regLayer = useRef(null);
  const cb = useRef({});
  cb.current = { colorFn, tooltipFn, onClick, onMarker, selected, highlight, focus };

  useEffect(() => {
    const m = L.map(el.current, { zoomControl: true, attributionControl: true, minZoom: 5, maxZoom: 13, zoomSnap: 0.25 }).setView([41.4, 64.6], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap · geoBoundaries', maxZoom: 19 }).addTo(m);
    map.current = m;
    let alive = true;
    loadGeo().then(([dist, reg]) => {
      if (!alive) return;
      layer.current = L.geoJSON(dist, {
        style: (f) => style(f.properties.id),
        onEachFeature: (f, lyr) => {
          byId.current[f.properties.id] = lyr;
          lyr.on({
            mouseover: (e) => { e.target.setStyle({ weight: 2.2, color: '#0f172a' }); e.target.bringToFront(); },
            mouseout: (e) => { e.target.setStyle(style(f.properties.id)); },
            click: () => cb.current.onClick?.(f.properties.id),
          });
          lyr.bindTooltip(() => cb.current.tooltipFn?.(f.properties.id) || '', { sticky: true, className: 'mtip', direction: 'top', offset: [0, -8] });
        },
      }).addTo(m);
      regLayer.current = L.geoJSON(reg, { style: { color: '#334155', weight: 1.4, fill: false, opacity: 0.55 }, interactive: false }).addTo(m);
      m.fitBounds(layer.current.getBounds(), { padding: [10, 10] });
      fitTo(cb.current.focus);
    });
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => { alive = false; ro.disconnect(); m.remove(); };
  }, []);

  function style(id) {
    const { colorFn: cf, selected: sel, highlight: hl } = cb.current;
    const isSel = sel === id;
    const dim = hl && !hl.has(id);
    return { fillColor: cf ? cf(id) : '#cbd5e1', fillOpacity: dim ? 0.18 : 0.88, color: isSel ? '#0f172a' : '#ffffff', weight: isSel ? 2.6 : 0.7, opacity: 1 };
  }

  useEffect(() => {
    if (!layer.current) return;
    layer.current.eachLayer((l) => l.setStyle(style(l.feature.properties.id)));
    if (selected && byId.current[selected]) byId.current[selected].bringToFront();
  });

  useEffect(() => {
    if (!map.current) return;
    if (mLayer.current) { mLayer.current.remove(); mLayer.current = null; }
    if (!markers?.length) return;
    const g = L.layerGroup();
    for (const o of markers) {
      L.circleMarker([o.lat, o.lng], { radius: 6, color: '#fff', weight: 1.5, fillColor: OFFER_COLOR[o.type], fillOpacity: 1 })
        .bindTooltip(o.label || '', { className: 'mtip' })
        .on('click', () => cb.current.onMarker?.(o))
        .addTo(g);
    }
    g.addTo(map.current);
    mLayer.current = g;
  }, [markers]);

  function fitTo(ids) {
    if (!map.current || !layer.current || !ids?.length) return;
    if (ids.length === 1 && byId.current[ids[0]]) { map.current.fitBounds(byId.current[ids[0]].getBounds(), { maxZoom: 10, padding: [40, 40] }); return; }
    const b = L.latLngBounds([]);
    ids.forEach((id) => byId.current[id] && b.extend(byId.current[id].getBounds()));
    if (b.isValid()) map.current.fitBounds(b, { padding: [20, 20] });
  }
  const focusKey = focus?.join(',');
  useEffect(() => fitTo(focus), [focusKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className="map" style={{ height }} />;
}

export { OFFER_COLOR };

// Viloyat tumanlarining yengil SVG sxemasi (kartochka va hisobot uchun)
export function MiniMap({ region, selected, colorFn, onClick, titleFn, height = 170 }) {
  const [geo, setGeo] = useState(null);
  useEffect(() => { let a = true; loadGeo().then(([d]) => a && setGeo(d)); return () => { a = false; }; }, []);
  if (!geo) return <div style={{ height }} />;
  const feats = geo.features.filter((f) => f.properties.id.startsWith(region));
  let x0 = 180, x1 = -180, y0 = 90, y1 = -90;
  const rings = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map((p) => p[0]);
  for (const f of feats) for (const r of rings(f.geometry)) for (const [x, y] of r) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const k = Math.cos((((y0 + y1) / 2) * Math.PI) / 180), W = 300, H = height, pad = 6;
  const s = Math.min((W - 2 * pad) / ((x1 - x0) * k), (H - 2 * pad) / (y1 - y0));
  const ox = (W - (x1 - x0) * k * s) / 2, oy = (H - (y1 - y0) * s) / 2;
  const d = (g) => rings(g).map((r) => 'M' + r.map(([x, y]) => `${(ox + (x - x0) * k * s).toFixed(1)},${(oy + (y1 - y) * s).toFixed(1)}`).join('L') + 'Z').join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="minimap">
      {feats.map((f) => {
        const id = f.properties.id;
        return <path key={id} d={d(f.geometry)} fill={colorFn ? colorFn(id) : id === selected ? '#0f766e' : '#e2e8f0'} stroke="#fff" strokeWidth={id === selected ? 0 : 0.8} onClick={() => onClick?.(id)} style={{ cursor: onClick ? 'pointer' : 'default' }}><title>{titleFn ? titleFn(id) : id}</title></path>;
      })}
      {feats.filter((f) => f.properties.id === selected).map((f) => <path key="sel" d={d(f.geometry)} fill="none" stroke="#0f172a" strokeWidth="1.6" pointerEvents="none" />)}
    </svg>
  );
}
