import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

const INCIDENT_TYPES: Record<string, { label: string; severity: string; dot: string }> = {
  cardiac_arrest: { label: 'Cardiac Arrest',   severity: 'CRITICAL', dot: 'bg-red-500' },
  choking:        { label: 'Choking',           severity: 'HIGH',     dot: 'bg-orange-500' },
  bleeding:       { label: 'Severe Bleeding',   severity: 'HIGH',     dot: 'bg-red-400' },
  unconscious:    { label: 'Unconscious Person',severity: 'HIGH',     dot: 'bg-purple-500' },
  other:          { label: 'Emergency',         severity: 'MEDIUM',   dot: 'bg-yellow-500' },
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-950 border-red-800 text-red-100',
  HIGH:     'bg-orange-950 border-orange-800 text-orange-100',
  MEDIUM:   'bg-yellow-950 border-yellow-800 text-yellow-100',
};

function timeAgo(dt: string) {
  const diff = Math.floor((Date.now() - new Date(dt + 'Z').getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const ROLE_DISPLAY: Record<string, string> = {
  doctor: 'Doctor', nurse: 'Nurse', paramedic: 'Paramedic / EMT',
  first_aider: 'Certified First Aider', other: 'Trained Responder',
};

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [myIncidents, setMyIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [locErr, setLocErr] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      const [inc, myInc] = await Promise.all([api.incidents.list(), api.me.incidents()]);
      setIncidents(inc);
      setMyIncidents(myInc);
      setLastRefresh(new Date());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const newStatus = !user?.is_available;
      await api.me.setStatus(newStatus);
      if (newStatus) {
        navigator.geolocation.getCurrentPosition(
          async pos => { await api.me.setLocation(pos.coords.latitude, pos.coords.longitude); setLocErr(''); },
          () => setLocErr('Location access denied — enable GPS for accurate alerts')
        );
      }
      const updated = await api.me.get();
      setUser(updated);
    } catch {}
    setToggling(false);
  };

  const respond = async (incidentId: string, status: 'accepted' | 'declined' | 'arrived') => {
    try { await api.incidents.respond(incidentId, status); loadData(); } catch {}
  };

  const inc = (t: string) => INCIDENT_TYPES[t] ?? INCIDENT_TYPES.other;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Responder Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Refreshed {lastRefresh.toLocaleTimeString()} · Auto-refresh every 30s
          </p>
        </div>
        <Link to="/map" className="text-sm text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
          Live map <span>→</span>
        </Link>
      </div>

      {/* Status + profile row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Availability control */}
        <div className={`lg:col-span-2 rounded-xl border p-6 flex items-center justify-between transition-colors ${user?.is_available ? 'bg-emerald-950 border-emerald-800' : 'bg-slate-800 border-slate-700'}`}>
          <div>
            <p className={`text-sm font-medium mb-1 ${user?.is_available ? 'text-emerald-400' : 'text-slate-400'}`}>
              {user?.is_available ? 'ACTIVE — YOU ARE RECEIVING ALERTS' : 'OFFLINE — NOT RECEIVING ALERTS'}
            </p>
            <h2 className="text-white text-2xl font-extrabold">
              {user?.is_available ? 'You are available' : 'You are offline'}
            </h2>
            {user?.is_available && !locErr && (
              <p className="text-emerald-500 text-sm mt-1">Location sharing active · 5 km alert radius</p>
            )}
            {locErr && <p className="text-yellow-400 text-sm mt-1">⚠ {locErr}</p>}
          </div>
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`shrink-0 px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${
              user?.is_available
                ? 'bg-slate-600 text-white hover:bg-slate-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {toggling ? 'Updating…' : user?.is_available ? 'Go Offline' : 'Go Available'}
          </button>
        </div>

        {/* Responder card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{user?.name}</p>
              <p className="text-slate-500 text-xs">{ROLE_DISPLAY[user?.role] ?? user?.role}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Verified</span>
              <span className={`font-medium ${user?.is_verified ? 'text-emerald-600' : 'text-orange-500'}`}>
                {user?.is_verified ? 'Verified ✓' : 'Pending verification'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Qualifications</span>
              <span className="text-slate-700 font-medium">{user?.qualifications?.length ?? 0}</span>
            </div>
          </div>
          {user?.qualifications?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {user.qualifications.slice(0, 3).map((q: string) => (
                <span key={q} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{q}</span>
              ))}
              {user.qualifications.length > 3 && (
                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded">+{user.qualifications.length - 3}</span>
              )}
            </div>
          )}
          <Link to="/profile" className="mt-3 inline-block text-xs text-red-600 hover:underline">Edit profile →</Link>
        </div>
      </div>

      {/* Assigned incidents */}
      {myIncidents.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Assigned to You ({myIncidents.length})</h2>
          </div>
          <div className="space-y-3">
            {myIncidents.map(item => {
              const t = inc(item.type);
              return (
                <div key={item.id} className={`border rounded-xl p-4 ${SEVERITY_STYLE[t.severity]}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`}></span>
                        <span className="font-bold">{t.label}</span>
                        <span className="text-xs opacity-60 border border-current/20 px-1.5 py-0.5 rounded">{t.severity}</span>
                        <span className="text-xs opacity-50 ml-1">{timeAgo(item.created_at)}</span>
                      </div>
                      {item.address && <p className="text-sm opacity-80 pl-4">📍 {item.address}</p>}
                      {item.description && <p className="text-sm opacity-60 pl-4 mt-0.5">{item.description}</p>}
                      <p className="text-xs opacity-50 pl-4 mt-1">Reported by {item.reported_by} · Your status: <strong>{item.response_status}</strong></p>
                    </div>
                    <div className="flex gap-2 flex-wrap pl-4 sm:pl-0">
                      {item.response_status === 'notified' && (
                        <>
                          <button onClick={() => respond(item.id, 'accepted')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500">Accept</button>
                          <button onClick={() => respond(item.id, 'declined')} className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20">Decline</button>
                        </>
                      )}
                      {item.response_status === 'accepted' && (
                        <button onClick={() => respond(item.id, 'arrived')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500">Mark On Scene</button>
                      )}
                      {item.response_status === 'arrived' && (
                        <span className="bg-blue-600/30 border border-blue-500/40 text-blue-200 px-4 py-2 rounded-lg text-sm font-medium">On Scene ✓</span>
                      )}
                      <Link to="/map" className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20">Map</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* All active incidents */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Active Incidents</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded ${incidents.length > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
            {incidents.length} active
          </span>
        </div>

        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Loading incidents…
          </div>
        )}

        {!loading && incidents.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-slate-700 font-medium">No active incidents</p>
            <p className="text-slate-400 text-sm mt-1">You will be alerted automatically when an incident occurs within your radius.</p>
          </div>
        )}

        {incidents.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {incidents.map((item, idx) => {
              const t = inc(item.type);
              return (
                <div key={item.id} className={`flex items-center gap-4 px-5 py-4 ${idx < incidents.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition-colors`}>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.dot}`}></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{t.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        t.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        t.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{t.severity}</span>
                    </div>
                    {item.address && <p className="text-slate-500 text-xs mt-0.5 truncate">📍 {item.address}</p>}
                    <p className="text-slate-400 text-xs mt-0.5">{timeAgo(item.created_at)} · {item.responder_count ?? 0} responding</p>
                  </div>
                  {item.my_response ? (
                    <span className="text-xs font-medium text-slate-500 border border-slate-200 px-3 py-1.5 rounded shrink-0">{item.my_response}</span>
                  ) : (
                    <button
                      onClick={() => respond(item.id, 'accepted')}
                      className="bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-red-700 transition-colors shrink-0"
                    >
                      Respond
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
