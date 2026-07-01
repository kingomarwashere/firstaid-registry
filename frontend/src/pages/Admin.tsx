import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api';
import { useAuth } from '../App';

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

function AdminGate({ onGranted }: { onGranted: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      await api.admin.bootstrap(pw);
      const fresh = await api.me.get();
      setUser(fresh);
      onGranted();
    } catch (e: any) {
      setErr('Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
          <p className="text-slate-500 text-sm mt-2">Enter the admin password to continue.</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{err}</p>}
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Password" required autoFocus
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
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
    `px-4 py-2 rounded font-medium text-sm transition-colors ${tab === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`;

  if (!user?.is_admin && !isAdmin) {
    return <AdminGate onGranted={() => setIsAdmin(true)} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium uppercase tracking-wider">Admin Access</span>
      </div>

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
            { label: 'Total Responders', value: stats.totalResponders, border: 'border-blue-200', text: 'text-blue-900', sub: 'text-blue-500' },
            { label: 'Active Now', value: stats.activeResponders, border: 'border-emerald-200', text: 'text-emerald-900', sub: 'text-emerald-500' },
            { label: 'Active Incidents', value: stats.activeIncidents, border: 'border-red-200', text: 'text-red-900', sub: 'text-red-500' },
            { label: 'Total Incidents', value: stats.totalIncidents, border: 'border-slate-200', text: 'text-slate-900', sub: 'text-slate-500' },
            { label: 'Total Responded', value: stats.totalResponded, border: 'border-purple-200', text: 'text-purple-900', sub: 'text-purple-500' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl border ${s.border} p-5`}>
              <div className={`text-3xl font-extrabold ${s.text}`}>{s.value}</div>
              <div className={`text-xs mt-1.5 font-medium ${s.sub}`}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* RESPONDERS */}
      {tab === 'responders' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Registered Responders</span>
            <span className="text-xs text-slate-500">{responders.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100">
                <tr>
                  {['Name', 'Role', 'Phone', 'Status', 'Verified', 'Admin', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {responders.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{r.name}</div>
                      <div className="text-slate-400 text-xs">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{ROLE_LABELS[r.role] ?? r.role}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${r.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {r.is_available ? 'Available' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${r.is_verified ? 'text-emerald-600' : 'text-orange-500'}`}>
                        {r.is_verified ? 'Verified ✓' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${r.is_admin ? 'text-purple-600' : 'text-slate-300'}`}>
                        {r.is_admin ? 'Admin' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => verifyResponder(r.id, !r.is_verified)}
                          className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${r.is_verified ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                        >
                          {r.is_verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button
                          onClick={() => toggleAdmin(r.id, !r.is_admin)}
                          className="text-xs px-2.5 py-1 rounded font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          {r.is_admin ? '− Admin' : '+ Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALL INCIDENTS */}
      {tab === 'incidents' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-slate-700">Incident Log</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100">
                <tr>
                  {['Type', 'Address', 'Status', 'Notified', 'Responding', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {incidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 capitalize">{inc.type?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate text-xs">{inc.address || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        inc.status === 'active' ? 'bg-red-100 text-red-700' :
                        inc.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>{inc.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 text-sm font-medium">{inc.total_notified}</td>
                    <td className="px-4 py-3 text-center text-slate-600 text-sm font-medium">{inc.responder_count}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(inc.created_at + 'Z').toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {inc.status === 'active' && (
                        <button onClick={() => resolveInc(inc.id)} className="text-xs px-2.5 py-1 rounded font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
