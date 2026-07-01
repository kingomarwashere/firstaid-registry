import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

const INCIDENT_TYPES: Record<string, { label: string; color: string; icon: string }> = {
  cardiac_arrest: { label: 'Cardiac Arrest', color: 'bg-red-100 text-red-800 border-red-200', icon: '❤️' },
  choking:        { label: 'Choking',        color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '😮' },
  bleeding:       { label: 'Severe Bleeding', color: 'bg-red-100 text-red-800 border-red-200', icon: '🩸' },
  unconscious:    { label: 'Unconscious',     color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '💤' },
  other:          { label: 'Other Emergency', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚠️' },
};

function timeAgo(dt: string) {
  const diff = Math.floor((Date.now() - new Date(dt + 'Z').getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [myIncidents, setMyIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [locErr, setLocErr] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [inc, myInc] = await Promise.all([api.incidents.list(), api.me.incidents()]);
      setIncidents(inc);
      setMyIncidents(myInc);
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
          async pos => {
            await api.me.setLocation(pos.coords.latitude, pos.coords.longitude);
            setLocErr('');
          },
          () => setLocErr('Location access denied — enable GPS for accurate alerts')
        );
      }

      const updated = await api.me.get();
      setUser(updated);
    } catch {}
    setToggling(false);
  };

  const respond = async (incidentId: string, status: 'accepted' | 'declined' | 'arrived') => {
    try {
      await api.incidents.respond(incidentId, status);
      loadData();
    } catch {}
  };

  const incType = (t: string) => INCIDENT_TYPES[t] ?? INCIDENT_TYPES.other;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Availability toggle */}
      <div className={`rounded-2xl p-8 mb-8 text-center transition-colors ${user?.is_available ? 'bg-green-600' : 'bg-gray-700'}`}>
        <p className="text-white text-lg mb-1 font-medium opacity-80">Your status</p>
        <h2 className="text-white text-4xl font-extrabold mb-6">
          {user?.is_available ? '✅ AVAILABLE' : '⬛ OFFLINE'}
        </h2>
        <button
          onClick={toggleAvailability} disabled={toggling}
          className={`px-10 py-3 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 ${
            user?.is_available
              ? 'bg-white text-green-700 hover:bg-green-50'
              : 'bg-green-500 text-white hover:bg-green-400'
          }`}
        >
          {toggling ? 'Updating...' : user?.is_available ? 'Go Offline' : 'Go Available'}
        </button>
        {locErr && <p className="text-yellow-200 text-sm mt-3">⚠️ {locErr}</p>}
        {user?.is_available && !locErr && (
          <p className="text-green-100 text-sm mt-3">📍 Sharing location — you'll be alerted for incidents within 5 km</p>
        )}
      </div>

      {/* My assigned incidents */}
      {myIncidents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Assigned to You ({myIncidents.length})
          </h2>
          <div className="space-y-4">
            {myIncidents.map(inc => {
              const t = incType(inc.type);
              return (
                <div key={inc.id} className={`border-2 rounded-xl p-5 ${t.color} flex flex-col sm:flex-row sm:items-center gap-4`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{t.icon}</span>
                      <span className="font-bold text-lg">{t.label}</span>
                      <span className="text-sm opacity-60">{timeAgo(inc.created_at)}</span>
                    </div>
                    {inc.address && <p className="text-sm opacity-80 mb-1">📍 {inc.address}</p>}
                    {inc.description && <p className="text-sm opacity-70">{inc.description}</p>}
                    <p className="text-xs opacity-60 mt-1">Status: <strong>{inc.response_status}</strong> · Reported by: {inc.reported_by}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {inc.response_status === 'notified' && (
                      <>
                        <button onClick={() => respond(inc.id, 'accepted')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">Accept</button>
                        <button onClick={() => respond(inc.id, 'declined')} className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600">Decline</button>
                      </>
                    )}
                    {inc.response_status === 'accepted' && (
                      <button onClick={() => respond(inc.id, 'arrived')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Mark Arrived</button>
                    )}
                    {inc.response_status === 'arrived' && (
                      <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">On Scene ✓</span>
                    )}
                    <Link to="/map" className="border border-current px-4 py-2 rounded-lg font-medium hover:opacity-80">View Map</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* All active incidents */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Active Incidents</h2>
          <Link to="/map" className="text-red-600 text-sm font-medium hover:underline">View on map →</Link>
        </div>

        {loading && <div className="text-center text-gray-400 py-12">Loading...</div>}

        {!loading && incidents.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-600 font-medium">No active incidents right now</p>
            <p className="text-gray-400 text-sm mt-1">Refreshes every 30 seconds</p>
          </div>
        )}

        <div className="space-y-3">
          {incidents.map(inc => {
            const t = incType(inc.type);
            return (
              <div key={inc.id} className={`border rounded-xl p-4 flex items-center gap-4 ${t.color}`}>
                <span className="text-2xl">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{t.label}</div>
                  {inc.address && <div className="text-sm opacity-70 truncate">📍 {inc.address}</div>}
                  <div className="text-xs opacity-60 mt-0.5">{timeAgo(inc.created_at)} · {inc.responder_count ?? 0} responding</div>
                </div>
                {inc.my_response ? (
                  <span className="text-xs font-medium bg-white/60 px-3 py-1 rounded-full">{inc.my_response}</span>
                ) : (
                  <button onClick={() => respond(inc.id, 'accepted')} className="bg-white/80 hover:bg-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                    Respond
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Profile card */}
      <section className="mt-10 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Your Profile</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><span className="text-gray-500">Role:</span> <span className="font-medium capitalize">{user?.role?.replace('_', ' ')}</span></div>
          <div><span className="text-gray-500">Verified:</span> <span className={`font-medium ${user?.is_verified ? 'text-green-600' : 'text-orange-500'}`}>{user?.is_verified ? 'Yes ✓' : 'Pending'}</span></div>
          <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{user?.phone}</span></div>
        </div>
        {user?.qualifications?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.qualifications.map((q: string) => (
              <span key={q} className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-1 rounded-full">{q}</span>
            ))}
          </div>
        )}
        <Link to="/profile" className="mt-4 inline-block text-sm text-red-600 hover:underline">Edit profile →</Link>
      </section>
    </div>
  );
}
