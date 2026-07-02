import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';
import { useAuth } from '../App';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const makeEmojiIcon = (emoji: string, size = 36) => L.divIcon({
  html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));user-select:none">${emoji}</div>`,
  className: '',
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
  popupAnchor: [0, -size / 2],
});

const redIcon       = makeIcon('red');
const greenIcon     = makeIcon('green');
const blueIcon      = makeIcon('blue');
const ambulanceIcon = makeEmojiIcon('🚑', 36);
const sosIcon       = makeEmojiIcon('🆘', 30);

const INCIDENT_LABELS: Record<string, string> = {
  cardiac_arrest: 'Cardiac Arrest', choking: 'Choking',
  bleeding: 'Severe Bleeding', unconscious: 'Unconscious Person', other: 'Emergency',
};

const ROLE_COLOR: Record<string, string> = {
  doctor: '#7c3aed', nurse: '#0891b2', paramedic: '#d97706',
  first_aider: '#16a34a', other: '#6b7280',
};

const ROLE_LABEL: Record<string, string> = {
  doctor: 'Dr', nurse: 'RN', paramedic: 'Para', first_aider: 'FA', other: 'CFR',
};

const SYDNEY: [number, number] = [-33.8688, 151.2093];
const AMBULANCE_STATION: [number, number] = [-33.8683, 151.2134]; // Sydney Hospital

// ── Routing ────────────────────────────────────────────────────────────────

async function fetchRoadRoute(
  from: [number, number],
  to: [number, number],
  profile: 'driving' | 'foot' = 'driving'
): Promise<[number, number][]> {
  try {
    // OSRM public demo — coords are lng,lat
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.routes?.[0]?.geometry?.coordinates) {
      // OSRM returns [lng, lat] — flip to [lat, lng] for Leaflet
      return data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      );
    }
  } catch {}
  // Fallback: straight line with a few mid-points so animation still works
  return [from, lerp(from, to, 0.33), lerp(from, to, 0.66), to];
}

// ── Geometry helpers ────────────────────────────────────────────────────────

function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  const c = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * c, a[1] + (b[1] - a[1]) * c];
}

function segDist(a: [number, number], b: [number, number]) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

/** Return position at fraction t (0–1) along an arbitrary polyline. */
function interpolateRoute(pts: [number, number][], t: number): [number, number] {
  if (!pts.length) return SYDNEY;
  if (pts.length === 1 || t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];

  // Cumulative distances
  const dists: number[] = [0];
  for (let i = 1; i < pts.length; i++) dists.push(dists[i - 1] + segDist(pts[i - 1], pts[i]));
  const total = dists[dists.length - 1];
  const target = t * total;

  for (let i = 1; i < pts.length; i++) {
    if (dists[i] >= target) {
      const segT = (target - dists[i - 1]) / (dists[i] - dists[i - 1]);
      return lerp(pts[i - 1], pts[i], segT);
    }
  }
  return pts[pts.length - 1];
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LocateMe({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  return (
    <button
      onClick={() =>
        navigator.geolocation.getCurrentPosition(p => {
          map.flyTo([p.coords.latitude, p.coords.longitude], 15);
          onLocate(p.coords.latitude, p.coords.longitude);
        })
      }
      className="absolute top-4 right-4 z-[1000] bg-white shadow border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
    >
      📍 My Location
    </button>
  );
}

function PickLocation({ onPick, active }: { onPick: (lat: number, lng: number) => void; active: boolean }) {
  useMapEvents({ click: e => active && onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, 14, { duration: 1.5 }); }, [target, map]);
  return null;
}

// ── Types ───────────────────────────────────────────────────────────────────

interface SimResponder {
  id: string;
  name: string;
  role: string;
  route: [number, number][];
  pos: [number, number];
  arrived: boolean;
  etaSeconds: number;
}

// ── Main component ──────────────────────────────────────────────────────────

export default function MapPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [aeds, setAeds] = useState<any[]>([]);
  const [onDuty, setOnDuty] = useState<any[]>([]);
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const [showAeds, setShowAeds] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [addingAed, setAddingAed] = useState(false);
  const [aedForm, setAedForm] = useState({ name: '', address: '', latitude: 0, longitude: 0 });
  const [aedMsg, setAedMsg] = useState('');

  // Simulation
  const [simActive, setSimActive] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simTarget, setSimTarget] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [ambulanceRoute, setAmbulanceRoute] = useState<[number, number][]>([]);
  const [ambulancePos, setAmbulancePos] = useState<[number, number]>(AMBULANCE_STATION);
  const [ambulanceArrived, setAmbulanceArrived] = useState(false);
  const [simResponders, setSimResponders] = useState<SimResponder[]>([]);
  const [simLog, setSimLog] = useState<string[]>([]);
  const [simElapsed, setSimElapsed] = useState(0);

  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const ambulanceArrivedRef = useRef(false);

  const loadData = useCallback(() => {
    api.incidents.list().then(setIncidents).catch(() => {});
    api.aeds.list().then(setAeds).catch(() => {});
    api.responders.onDuty().then(setOnDuty).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
    navigator.geolocation.getCurrentPosition(p => setMyPos([p.coords.latitude, p.coords.longitude]));
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const stopSim = useCallback(() => {
    if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
  }, []);

  const startSimulation = useCallback(async () => {
    stopSim();
    setSimLoading(true);

    // Random incident near Sydney CBD
    const incLat = -33.8688 + (Math.random() - 0.5) * 0.018;
    const incLng = 151.2093 + (Math.random() - 0.5) * 0.025;
    const target: [number, number] = [incLat, incLng];

    // Create real incident
    try {
      await api.incidents.create({
        reported_by: 'Emergency Caller',
        type: 'cardiac_arrest',
        latitude: incLat, longitude: incLng,
        address: 'Sydney CBD (Demo)', description: 'Demo — simulated emergency call',
      });
    } catch {}

    // Pick 3 nearest on-duty responders
    const sorted = [...onDuty]
      .filter(r => r.latitude && r.longitude)
      .sort((a, b) =>
        segDist([a.latitude, a.longitude], target) - segDist([b.latitude, b.longitude], target)
      )
      .slice(0, 3);

    // Fetch all routes in parallel (ambulance + each responder)
    setSimLog(['🆘 Emergency call received — cardiac arrest', '📡 Routing responders…']);

    const [ambRoute, ...respRoutes] = await Promise.all([
      fetchRoadRoute(AMBULANCE_STATION, target, 'driving'),
      ...sorted.map(r => fetchRoadRoute([r.latitude, r.longitude], target, 'driving')),
    ]);

    const etaTimes = [12, 20, 30];
    const responders: SimResponder[] = sorted.map((r, i) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      route: respRoutes[i] ?? [([r.latitude, r.longitude] as [number, number]), target],
      pos: [r.latitude, r.longitude],
      arrived: false,
      etaSeconds: etaTimes[i] ?? 35,
    }));

    const AMBULANCE_ETA = 45;
    const TICK = 150; // ms

    setAmbulanceRoute(ambRoute);
    setAmbulancePos(AMBULANCE_STATION);
    ambulanceArrivedRef.current = false;
    setAmbulanceArrived(false);
    setSimResponders(responders);
    setSimTarget(target);
    setFlyTarget(target);
    setSimActive(true);
    setSimLoading(false);
    elapsedRef.current = 0;
    setSimElapsed(0);
    setSimLog([
      '🆘 Emergency call received — cardiac arrest',
      `📡 Alert sent to ${responders.length} nearby responders`,
      '🚑 Ambulance dispatched from Sydney Hospital',
    ]);

    simRef.current = setInterval(() => {
      elapsedRef.current += TICK / 1000;
      const elapsed = elapsedRef.current;
      setSimElapsed(Math.floor(elapsed));

      // Ambulance along road route
      const ambT = Math.min(1, elapsed / AMBULANCE_ETA);
      setAmbulancePos(interpolateRoute(ambRoute, ambT));
      if (ambT >= 1 && !ambulanceArrivedRef.current) {
        ambulanceArrivedRef.current = true;
        setAmbulanceArrived(true);
        setSimLog(l => [...l, `🚑 Ambulance on scene — ${AMBULANCE_ETA}s`]);
        stopSim();
      }

      // Responders along their road routes
      setSimResponders(prev => prev.map((r, i) => {
        if (r.arrived) return r;
        const t = Math.min(1, elapsed / r.etaSeconds);
        const pos = interpolateRoute(r.route, t);
        const arrived = t >= 1;
        if (arrived) {
          setSimLog(l => [...l, `✅ ${r.name} (${ROLE_LABEL[r.role]}) on scene — ${r.etaSeconds}s`]);
        }
        return { ...r, pos, arrived };
      }));
    }, TICK);
  }, [onDuty, stopSim, loadData]);

  const resetSim = () => {
    stopSim();
    setSimActive(false);
    setSimLoading(false);
    setSimTarget(null);
    setFlyTarget(null);
    setAmbulanceRoute([]);
    setAmbulancePos(AMBULANCE_STATION);
    setAmbulanceArrived(false);
    ambulanceArrivedRef.current = false;
    setSimResponders([]);
    setSimLog([]);
    setSimElapsed(0);
    elapsedRef.current = 0;
    loadData();
  };

  const respondToIncident = async (id: string, status: string) => {
    setResponding(id);
    try { await api.incidents.respond(id, status); } catch {}
    api.incidents.list().then(setIncidents);
    setResponding(null);
  };

  const submitAed = async () => {
    if (!aedForm.name || !aedForm.address || !aedForm.latitude) return;
    try {
      await api.aeds.create(aedForm);
      setAedMsg('AED location added ✓');
      setAddingAed(false);
      setAedForm({ name: '', address: '', latitude: 0, longitude: 0 });
      api.aeds.list().then(setAeds);
    } catch (err: any) { setAedMsg(err.message); }
  };

  useEffect(() => () => stopSim(), [stopSim]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col">

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 flex-wrap z-10 shadow-sm">
        <span className="font-semibold text-slate-800 text-sm">Live Operational Map</span>

        {!simActive && !simLoading ? (
          <button
            onClick={startSimulation}
            disabled={onDuty.length === 0}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors shadow"
          >
            <span className="animate-pulse">🆘</span> Simulate Emergency Call
          </button>
        ) : simLoading ? (
          <span className="text-sm text-slate-500 font-medium animate-pulse">⏳ Routing via road network…</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-sm animate-pulse">● ACTIVE</span>
            <span className="text-slate-500 text-xs tabular-nums">{simElapsed}s elapsed</span>
            <button onClick={resetSim} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              Reset
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showResponders} onChange={e => setShowResponders(e.target.checked)} className="accent-amber-500" />
            <span className="text-slate-600 text-xs">Responders</span>
            <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded font-medium">{onDuty.length}</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showAeds} onChange={e => setShowAeds(e.target.checked)} className="accent-emerald-600" />
            <span className="text-slate-600 text-xs">AEDs</span>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded font-medium">{aeds.length}</span>
          </label>
          <button
            onClick={() => { setAddingAed(!addingAed); setAedMsg(''); }}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${addingAed ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-slate-500 hover:border-slate-400'}`}
          >
            {addingAed ? 'Cancel' : '+ Add AED'}
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4 ml-auto text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>Incident</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>AED</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-600 inline-block"></span>Doctor</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-cyan-500 inline-block"></span>Nurse</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>Paramedic</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block"></span>First Aider</span>
        </div>
      </div>

      {addingAed && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-emerald-700 font-medium">Click map to pin AED</span>
          <input placeholder="Name" value={aedForm.name} onChange={e => setAedForm(f => ({ ...f, name: e.target.value }))} className="border rounded px-2 py-1 text-sm" />
          <input placeholder="Address" value={aedForm.address} onChange={e => setAedForm(f => ({ ...f, address: e.target.value }))} className="border rounded px-2 py-1 text-sm w-56" />
          {aedForm.latitude !== 0 && <span className="text-emerald-600 text-xs">📍 pinned</span>}
          <button onClick={submitAed} className="bg-emerald-600 text-white px-3 py-1 rounded font-medium hover:bg-emerald-700 text-sm">Save</button>
          {aedMsg && <span className="text-emerald-700 text-sm">{aedMsg}</span>}
        </div>
      )}

      <div className="flex-1 flex relative overflow-hidden">

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer center={SYDNEY} zoom={12} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocateMe onLocate={(lat, lng) => setMyPos([lat, lng])} />
            <FlyTo target={flyTarget} />
            <PickLocation
              onPick={(lat, lng) => { if (addingAed) setAedForm(f => ({ ...f, latitude: lat, longitude: lng })); }}
              active={addingAed}
            />

            {/* My location */}
            {myPos && (
              <Marker position={myPos} icon={blueIcon}>
                <Popup><strong>You</strong><br />{user?.name}</Popup>
              </Marker>
            )}
            {user?.is_available && myPos && (
              <Circle center={myPos} radius={5000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.04, weight: 1, dashArray: '4' }} />
            )}

            {/* Real incidents */}
            {incidents.map(inc => (
              <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={redIcon}>
                <Popup minWidth={220}>
                  <div>
                    <div className="font-bold text-red-700 text-sm">{INCIDENT_LABELS[inc.type] ?? 'Emergency'}</div>
                    {inc.address && <div className="text-xs text-gray-600 mt-1">📍 {inc.address}</div>}
                    {inc.description && <div className="text-xs text-gray-500 mt-0.5">{inc.description}</div>}
                    <div className="text-xs text-gray-400 mt-2 mb-2">{inc.responder_count ?? 0} responder(s) en route</div>
                    {!inc.my_response || inc.my_response === 'notified' ? (
                      <button
                        onClick={() => respondToIncident(inc.id, 'accepted')} disabled={responding === inc.id}
                        className="w-full bg-red-600 text-white py-1.5 rounded text-sm font-semibold hover:bg-red-700"
                      >
                        {responding === inc.id ? '…' : 'Respond Now'}
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-emerald-700">Status: {inc.my_response}</span>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* AEDs */}
            {showAeds && aeds.map(aed => (
              <Marker key={aed.id} position={[aed.latitude, aed.longitude]} icon={greenIcon}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold text-emerald-700">AED Defibrillator</div>
                    <div className="font-medium">{aed.name}</div>
                    <div className="text-gray-500 text-xs">{aed.address}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Static on-duty responders (not currently in sim) */}
            {showResponders && onDuty
              .filter(r => !simActive || !simResponders.find(s => s.id === r.id))
              .map(r => (
                <CircleMarker
                  key={r.id}
                  center={[r.latitude, r.longitude]}
                  radius={8}
                  pathOptions={{ color: ROLE_COLOR[r.role] ?? '#6b7280', fillColor: ROLE_COLOR[r.role] ?? '#6b7280', fillOpacity: 0.85, weight: 2 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{r.role?.replace('_', ' ')}</div>
                      <div className="text-xs text-emerald-600 font-medium mt-1">● Available</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))
            }

            {/* ── SIMULATION LAYER ── */}
            {simActive && simTarget && (
              <>
                {/* Incident */}
                <Marker position={simTarget} icon={sosIcon}>
                  <Popup><strong className="text-red-700">🆘 Cardiac Arrest</strong><br /><span className="text-xs">Demo emergency</span></Popup>
                </Marker>
                <Circle center={simTarget} radius={250} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 1.5, dashArray: '5' }} />

                {/* Full ambulance road route (ghost line) */}
                {ambulanceRoute.length > 1 && (
                  <Polyline
                    positions={ambulanceRoute}
                    pathOptions={{ color: '#ef4444', weight: 3, dashArray: '8 5', opacity: 0.35 }}
                  />
                )}

                {/* Ambulance marker — follows road */}
                <Marker position={ambulancePos} icon={ambulanceIcon}>
                  <Popup>
                    <div className="text-sm font-semibold">🚑 NSW Ambulance</div>
                    <div className="text-xs text-gray-500">Dispatched from Sydney Hospital</div>
                    <div className={`text-xs font-medium mt-1 ${ambulanceArrived ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {ambulanceArrived ? '✓ On scene' : `ETA ~${Math.max(0, 45 - simElapsed)}s`}
                    </div>
                  </Popup>
                </Marker>

                {/* Responding CFRs — each following their own road route */}
                {simResponders.map(r => (
                  <span key={r.id}>
                    {r.route.length > 1 && (
                      <Polyline
                        positions={r.route}
                        pathOptions={{ color: ROLE_COLOR[r.role] ?? '#6b7280', weight: 2.5, dashArray: '6 5', opacity: 0.3 }}
                      />
                    )}
                    <CircleMarker
                      center={r.pos}
                      radius={10}
                      pathOptions={{
                        color: r.arrived ? '#16a34a' : (ROLE_COLOR[r.role] ?? '#6b7280'),
                        fillColor: r.arrived ? '#16a34a' : (ROLE_COLOR[r.role] ?? '#6b7280'),
                        fillOpacity: 0.9,
                        weight: 2.5,
                      }}
                    >
                      <Popup>
                        <div className="text-sm font-semibold">{r.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{r.role?.replace('_', ' ')}</div>
                        <div className={`text-xs font-medium mt-1 ${r.arrived ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {r.arrived ? '✓ On scene' : `ETA ~${Math.max(0, r.etaSeconds - simElapsed)}s`}
                        </div>
                      </Popup>
                    </CircleMarker>
                  </span>
                ))}
              </>
            )}

            {addingAed && aedForm.latitude !== 0 && (
              <Marker position={[aedForm.latitude, aedForm.longitude]} icon={greenIcon}>
                <Popup>New AED (unsaved)</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className="hidden xl:flex flex-col w-56 bg-slate-900 text-white border-l border-slate-700 shrink-0">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">On Duty</p>
            <p className="text-2xl font-extrabold mt-0.5">{onDuty.length}</p>
          </div>
          <div className="px-3 py-2 border-b border-slate-700 grid grid-cols-2 gap-2">
            {(['doctor', 'nurse', 'paramedic', 'first_aider'] as const).map(role => (
              <div key={role} className="bg-slate-800 rounded p-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ROLE_COLOR[role] }}></span>
                  <span className="text-slate-400 text-xs">{ROLE_LABEL[role]}</span>
                </div>
                <div className="font-bold">{onDuty.filter(r => r.role === role).length}</div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            {simLog.length > 0 ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Dispatch Log</p>
                <div className="space-y-2">
                  {simLog.map((entry, i) => (
                    <div key={i} className="text-xs text-slate-300 border-l-2 border-red-500 pl-2 py-0.5 leading-snug">{entry}</div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-xs text-center pt-8 leading-relaxed">
                Press "Simulate Emergency Call" to see a live road-routing dispatch demo.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
