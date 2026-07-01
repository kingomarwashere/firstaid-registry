import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';
import { useAuth } from '../App';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const INCIDENT_LABELS: Record<string, string> = {
  cardiac_arrest: '❤️ Cardiac Arrest', choking: '😮 Choking',
  bleeding: '🩸 Severe Bleeding', unconscious: '💤 Unconscious', other: '⚠️ Emergency',
};

function LocateMe({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  return (
    <button
      onClick={() => navigator.geolocation.getCurrentPosition(pos => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 15);
        onLocate(pos.coords.latitude, pos.coords.longitude);
      })}
      className="absolute top-4 right-4 z-[1000] bg-white shadow-md px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
    >
      📍 My Location
    </button>
  );
}

function PickLocation({ onPick, active }: { onPick: (lat: number, lng: number) => void; active: boolean }) {
  useMapEvents({ click: e => active && onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function MapPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [aeds, setAeds] = useState<any[]>([]);
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const [showAeds, setShowAeds] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [addingAed, setAddingAed] = useState(false);
  const [aedForm, setAedForm] = useState({ name: '', address: '', latitude: 0, longitude: 0 });
  const [aedMsg, setAedMsg] = useState('');

  const SINGAPORE: [number, number] = [1.3521, 103.8198];

  useEffect(() => {
    api.incidents.list().then(setIncidents).catch(() => {});
    api.aeds.list().then(setAeds).catch(() => {});
    navigator.geolocation.getCurrentPosition(pos => setMyPos([pos.coords.latitude, pos.coords.longitude]));
  }, []);

  const respondToIncident = async (id: string, status: string) => {
    setResponding(id);
    try { await api.incidents.respond(id, status); } catch {}
    const fresh = await api.incidents.list();
    setIncidents(fresh);
    setResponding(null);
  };

  const pickForAed = (lat: number, lng: number) => {
    if (!addingAed) return;
    setAedForm(f => ({ ...f, latitude: lat, longitude: lng }));
  };

  const submitAed = async () => {
    if (!aedForm.name || !aedForm.address || !aedForm.latitude) return;
    try {
      await api.aeds.create(aedForm);
      setAedMsg('AED location added!');
      setAddingAed(false);
      setAedForm({ name: '', address: '', latitude: 0, longitude: 0 });
      api.aeds.list().then(setAeds);
    } catch (err: any) {
      setAedMsg(err.message);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 flex-wrap z-10">
        <span className="font-semibold text-gray-800">Live Map</span>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAeds} onChange={e => setShowAeds(e.target.checked)} className="accent-green-600" />
          Show AEDs
        </label>
        <button
          onClick={() => { setAddingAed(!addingAed); setAedMsg(''); }}
          className={`text-sm px-3 py-1 rounded-full border transition-colors ${addingAed ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600 hover:border-green-500'}`}
        >
          {addingAed ? 'Cancel AED' : '+ Add AED'}
        </button>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span> Incident</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> AED</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span> You</span>
        </div>
        {incidents.length > 0 && <span className="ml-auto text-red-600 font-medium text-sm animate-pulse">{incidents.length} active incident{incidents.length > 1 ? 's' : ''}</span>}
      </div>

      {addingAed && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex flex-wrap items-end gap-3 text-sm">
          <span className="text-green-700 font-medium">Click map to set AED location</span>
          <input placeholder="Name" value={aedForm.name} onChange={e => setAedForm(f => ({ ...f, name: e.target.value }))} className="border rounded px-2 py-1" />
          <input placeholder="Address" value={aedForm.address} onChange={e => setAedForm(f => ({ ...f, address: e.target.value }))} className="border rounded px-2 py-1 w-64" />
          {aedForm.latitude !== 0 && <span className="text-green-600">📍 {aedForm.latitude.toFixed(4)}, {aedForm.longitude.toFixed(4)}</span>}
          <button onClick={submitAed} className="bg-green-600 text-white px-4 py-1 rounded-lg font-medium hover:bg-green-700">Save AED</button>
          {aedMsg && <span className="text-green-700">{aedMsg}</span>}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={myPos ?? SINGAPORE} zoom={13} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocateMe onLocate={(lat, lng) => setMyPos([lat, lng])} />
          <PickLocation onPick={pickForAed} active={addingAed} />

          {myPos && (
            <Marker position={myPos} icon={blueIcon}>
              <Popup><strong>You are here</strong></Popup>
            </Marker>
          )}

          {user?.is_available && myPos && (
            <Circle center={myPos} radius={5000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1 }} />
          )}

          {incidents.map(inc => (
            <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={redIcon}>
              <Popup>
                <div className="min-w-[200px]">
                  <p className="font-bold text-red-700 mb-1">{INCIDENT_LABELS[inc.type] ?? '⚠️ Emergency'}</p>
                  {inc.address && <p className="text-sm text-gray-600 mb-1">📍 {inc.address}</p>}
                  {inc.description && <p className="text-sm text-gray-500 mb-2">{inc.description}</p>}
                  <p className="text-xs text-gray-400 mb-3">{inc.responder_count ?? 0} responder(s) en route</p>
                  {inc.my_response === 'notified' || !inc.my_response ? (
                    <button
                      onClick={() => respondToIncident(inc.id, 'accepted')} disabled={responding === inc.id}
                      className="w-full bg-red-600 text-white py-1.5 rounded font-medium text-sm hover:bg-red-700"
                    >
                      {responding === inc.id ? '...' : 'Respond Now'}
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-green-700">Status: {inc.my_response}</span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {showAeds && aeds.map(aed => (
            <Marker key={aed.id} position={[aed.latitude, aed.longitude]} icon={greenIcon}>
              <Popup>
                <p className="font-bold text-green-700">🟢 AED Location</p>
                <p className="font-medium">{aed.name}</p>
                <p className="text-sm text-gray-600">{aed.address}</p>
              </Popup>
            </Marker>
          ))}

          {addingAed && aedForm.latitude !== 0 && (
            <Marker position={[aedForm.latitude, aedForm.longitude]} icon={greenIcon}>
              <Popup>New AED (unsaved)</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
