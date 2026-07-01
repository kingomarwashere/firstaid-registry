import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const INCIDENT_TYPES = [
  { value: 'cardiac_arrest', label: '❤️ Cardiac Arrest' },
  { value: 'choking', label: '😮 Choking' },
  { value: 'bleeding', label: '🩸 Severe Bleeding' },
  { value: 'unconscious', label: '💤 Unconscious Person' },
  { value: 'other', label: '⚠️ Other Emergency' },
];

const ROLE_LABELS: Record<string, string> = {
  doctor: 'Doctor', nurse: 'Nurse', paramedic: 'Paramedic', first_aider: 'First Aider', other: 'Other',
};

function MapPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function Admin() {
  const [tab, setTab] = useState<'stats' | 'responders' | 'incidents' | 'create'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [responders, setResponders] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [incForm, setIncForm] = useState({ reported_by: '', type: 'cardiac_arrest', address: '', description: '', latitude: 0, longitude: 0 });
  const [incMsg, setIncMsg] = useState('');
  const [pickedPos, setPickedPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);

  const SINGAPORE: [number, number] = [1.3521, 103.8198];

  const load = useCallback(async () => {
    try {
      if (tab === 'stats') setStats(await api.admin.stats());
      if (tab === 'responders') setResponders(await api.admin.responders());
      if (tab === 'incidents') setIncidents(await api.incidents.all());
    } catch {}
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const verifyResponder = async (id: string, val: boolean) => {
    await api.admin.verify(id, val);
    load();
  };

  const toggleAdmin = async (id: string, val: boolean) => {
    await api.admin.setAdmin(id, val);
    load();
  };

  const resolveInc = async (id: string) => {
    await api.incidents.resolve(id);
    load();
  };

  const pickForInc = (lat: number, lng: number) => {
    setPickedPos([lat, lng]);
    setIncForm(f => ({ ...f, latitude: lat, longitude: lng }));
  };

  const createIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incForm.latitude) { setIncMsg('Click the map to set location'); return; }
    setLoading(true); setIncMsg('');
    try {
      const res = await api.incidents.create(incForm);
      setIncMsg(`✓ Incident created. ${res.notified} responders notified.`);
      setIncForm({ reported_by: '', type: 'cardiac_arrest', address: '', description: '', latitude: 0, longitude: 0 });
      setPickedPos(null);
    } catch (err: any) {
      setIncMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (t: string) =>
    `px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === t ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button className={tabClass('stats')} onClick={() => setTab('stats')}>Stats</button>
        <button className={tabClass('responders')} onClick={() => setTab('responders')}>Responders</button>
        <button className={tabClass('incidents')} onClick={() => setTab('incidents')}>All Incidents</button>
        <button className={tabClass('create')} onClick={() => setTab('create')}>Create Incident</button>
      </div>

      {/* STATS */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Responders', value: stats.totalResponders, color: 'bg-blue-50 text-blue-800' },
            { label: 'Active Now', value: stats.activeResponders, color: 'bg-green-50 text-green-800' },
            { label: 'Active Incidents', value: stats.activeIncidents, color: 'bg-red-50 text-red-800' },
            { label: 'Total Incidents', value: stats.totalIncidents, color: 'bg-gray-50 text-gray-800' },
            { label: 'Total Responded', value: stats.totalResponded, color: 'bg-purple-50 text-purple-800' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="text-sm mt-1 opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* RESPONDERS */}
      {tab === 'responders' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Role', 'Phone', 'Status', 'Verified', 'Admin', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {responders.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-gray-400 text-xs">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ROLE_LABELS[r.role] ?? r.role}</td>
                  <td className="px-4 py-3 text-gray-600">{r.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.is_available ? 'Available' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${r.is_verified ? 'text-green-600' : 'text-orange-500'}`}>
                      {r.is_verified ? '✓ Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${r.is_admin ? 'text-purple-600' : 'text-gray-400'}`}>
                      {r.is_admin ? '✓ Admin' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => verifyResponder(r.id, !r.is_verified)}
                        className={`text-xs px-2 py-1 rounded ${r.is_verified ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      >
                        {r.is_verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        onClick={() => toggleAdmin(r.id, !r.is_admin)}
                        className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        {r.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ALL INCIDENTS */}
      {tab === 'incidents' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Type', 'Address', 'Status', 'Notified', 'Responding', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incidents.map(inc => (
                <tr key={inc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium capitalize">{inc.type?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{inc.address || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      inc.status === 'active' ? 'bg-red-100 text-red-700' :
                      inc.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{inc.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">{inc.total_notified}</td>
                  <td className="px-4 py-3 text-center">{inc.responder_count}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(inc.created_at + 'Z').toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {inc.status === 'active' && (
                      <button onClick={() => resolveInc(inc.id)} className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE INCIDENT */}
      {tab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={createIncident} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Log New Incident</h2>
            {incMsg && <div className={`px-4 py-3 rounded-lg text-sm ${incMsg.startsWith('Error') || incMsg.includes('map') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{incMsg}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
              <select value={incForm.type} onChange={e => setIncForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500">
                {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported By</label>
              <input placeholder="Caller name or 'Dispatch'" value={incForm.reported_by} onChange={e => setIncForm(f => ({ ...f, reported_by: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
              <input placeholder="123 Orchard Road" value={incForm.address} onChange={e => setIncForm(f => ({ ...f, address: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea placeholder="Additional details..." value={incForm.description} onChange={e => setIncForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 h-20 resize-none" />
            </div>

            {pickedPos ? (
              <p className="text-sm text-green-600">📍 Location set: {pickedPos[0].toFixed(5)}, {pickedPos[1].toFixed(5)}</p>
            ) : (
              <p className="text-sm text-orange-500">👆 Click the map to set the incident location</p>
            )}

            <button type="submit" disabled={loading || !pickedPos}
              className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Incident & Alert Responders'}
            </button>
          </form>

          <div className="rounded-xl overflow-hidden border border-gray-200 h-96 lg:h-auto">
            <MapContainer center={SINGAPORE} zoom={12} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapPicker onPick={pickForInc} />
              {pickedPos && <Marker position={pickedPos} />}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
