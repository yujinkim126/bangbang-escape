import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { useApp } from "../lib/data";
import type { Store } from "../lib/types";
import { ViewToggle } from "../components/Bits";

type Pin = "success" | "fail" | "open" | "empty" | "unknown";

const icons = new Map<Pin, L.DivIcon>();
function icon(kind: Pin) {
  if (!icons.has(kind)) {
    const flag = kind === "success" || kind === "fail";
    icons.set(kind, L.divIcon({
      className: "",
      html: flag
        ? `<div class="pin pin-flag pin-${kind}"><svg viewBox="0 0 24 32" width="24" height="32"><path class="pole" d="M5 2v29" stroke-width="2.6" stroke-linecap="round"/><path d="M6 3h15l-4 5.5L21 14H6z" fill="currentColor" stroke="var(--pin)" stroke-width="1.6" stroke-linejoin="round"/></svg></div>`
        : `<div class="pin pin-dot pin-${kind}"></div>`,
      iconSize: flag ? [24, 32] : [14, 14],
      iconAnchor: flag ? [5, 31] : [7, 7],
      popupAnchor: flag ? [6, -28] : [0, -8],
    }));
  }
  return icons.get(kind)!;
}

export default function MapPage() {
  const { stores, themes, records, catalog, session } = useApp();

  const byStore = useMemo(() => {
    const m = new Map<string, { total: number; played: number; success: number }>();
    for (const t of themes) {
      const s = m.get(t.store_id) ?? { total: 0, played: 0, success: 0 };
      if (t.status === "open") s.total++;
      m.set(t.store_id, s);
    }
    const seen = new Set<string>();
    for (const r of records) {
      const t = catalog.themes.get(r.theme_id);
      if (!t) continue;
      const s = m.get(t.store_id)!;
      if (!seen.has(t.id)) { s.played++; seen.add(t.id); }
      if (r.success) s.success++;
    }
    return m;
  }, [themes, records, catalog]);

  const played = useMemo(() => {
    let s = 0, t = 0;
    for (const v of byStore.values()) { if (v.played) s++; t += v.played; }
    return { stores: s, themes: t };
  }, [byStore]);

  const pinOf = (s: Store): Pin => {
    const st = byStore.get(s.id);
    if (st?.played) return st.success ? "success" : "fail";
    if (s.status !== "open") return "unknown";
    return st?.total ? "open" : "empty";
  };

  const center: [number, number] = stores.length
    ? [stores.reduce((a, s) => a + s.lat, 0) / stores.length, stores.reduce((a, s) => a + s.lng, 0) / stores.length]
    : [37.5525, 126.9225];

  return (
    <div className="map-page">
      <MapContainer center={center} zoom={11} className="map" scrollWheelZoom zoomControl={false}>
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stores.map((s) => {
          const st = byStore.get(s.id);
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={icon(pinOf(s))}>
              <Popup>
                <div className="popup">
                  <div className="popup-name">{s.name}</div>
                  <div className="popup-meta">
                    {st?.total ? `테마 ${st.total}개 중 ${st.played}개 열었어요` : "아직 테마 정보가 없어요"}
                    {s.status !== "open" && " · 운영 확인 필요"}
                  </div>
                  <div className="popup-actions">
                    {st?.total ? <Link to={`/themes?store=${s.id}`}>테마 보기 →</Link> : null}
                    {s.kakao_url && <a href={s.kakao_url} target="_blank" rel="noreferrer">카카오맵</a>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <ViewToggle className="map-toggle" />

      <aside className="map-info card">
        <div className="map-info-title">
          {session && played.stores > 0
            ? <>내가 가본 매장 <span className="hl">{played.stores}곳</span> · 테마 {played.themes}개</>
            : <>서울 방탈출 매장 {stores.length}곳</>}
        </div>
        <div className="legend">
          <span><i className="lg lg-success" />탈출</span>
          <span><i className="lg lg-fail" />실패</span>
          <span><i className="lg lg-open" />안 가본 곳</span>
          <span><i className="lg lg-empty" />정보 없음</span>
        </div>
      </aside>
    </div>
  );
}

