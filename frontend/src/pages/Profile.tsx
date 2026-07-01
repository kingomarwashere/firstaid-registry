import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

const QUALS = ['CPR Certified', 'AED Certified', 'Basic Life Support (BLS)', 'Advanced Life Support (ALS)', 'ACLS', 'ATLS', 'Wilderness First Aid', 'Paediatric First Aid', 'Mental Health First Aid'];
const ROLES = [
  { value: 'doctor', label: 'Doctor / Physician' },
  { value: 'nurse', label: 'Nurse / Midwife' },
  { value: 'paramedic', label: 'Paramedic / EMT' },
  { value: 'first_aider', label: 'Certified First Aider' },
  { value: 'other', label: 'Other (trained responder)' },
];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', role: '', qualifications: [] as string[] });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [myIncidents, setMyIncidents] = useState<any[]>([]);
  const [adminPw, setAdminPw] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        phone: user.phone ?? '',
        role: user.role ?? '',
        qualifications: user.qualifications ?? [],
      });
    }
    api.me.incidents().then(setMyIncidents).catch(() => {});
  }, [user]);

  const toggleQual = (q: string) =>
    setForm(f => ({
      ...f,
      qualifications: f.qualifications.includes(q) ? f.qualifications.filter(x => x !== q) : [...f.qualifications, q],
    }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      await api.me.update(form);
      const fresh = await api.me.get();
      setUser(fresh);
      setMsg('Profile saved ✓');
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

      <form onSubmit={save} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 mb-8">
        {msg && <div className={`px-4 py-3 rounded-lg text-sm ${msg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={user?.email ?? ''} disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
          <div className="flex flex-wrap gap-2">
            {QUALS.map(q => (
              <button
                type="button" key={q} onClick={() => toggleQual(q)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  form.qualifications.includes(q) ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300 text-gray-600 hover:border-red-400'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={loading} className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Verified:</span>
            <span className={user?.is_verified ? 'text-green-600 font-medium' : 'text-orange-500'}>
              {user?.is_verified ? 'Yes ✓' : 'Pending admin review'}
            </span>
          </div>
        </div>
      </form>

      {/* Claim admin */}
      {!user?.is_admin && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Admin Access</h2>
          <p className="text-sm text-gray-500 mb-4">Enter the admin password to gain admin privileges.</p>
          <form onSubmit={async e => {
            e.preventDefault();
            setAdminLoading(true); setAdminMsg('');
            try {
              await api.admin.bootstrap(adminPw);
              const fresh = await api.me.get();
              setUser(fresh);
              setAdminMsg('You are now an admin. Refresh to see the Admin tab.');
            } catch (err: any) {
              setAdminMsg(err.message);
            } finally {
              setAdminLoading(false);
            }
          }} className="flex gap-3 items-center">
            <input
              type="password" value={adminPw} onChange={e => setAdminPw(e.target.value)}
              placeholder="Admin password" required
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 w-48"
            />
            <button type="submit" disabled={adminLoading} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50">
              {adminLoading ? '...' : 'Claim'}
            </button>
            {adminMsg && <span className={`text-sm ${adminMsg.includes('now') ? 'text-green-600' : 'text-red-600'}`}>{adminMsg}</span>}
          </form>
        </div>
      )}

      {/* Response history */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Active Response Assignments</h2>
        {myIncidents.length === 0 ? (
          <p className="text-gray-400 text-sm">No active assignments</p>
        ) : (
          <div className="space-y-2">
            {myIncidents.map(inc => (
              <div key={inc.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-medium capitalize">{inc.type?.replace('_', ' ')}</span>
                  {inc.address && <span className="text-gray-500 ml-2">{inc.address}</span>}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  inc.response_status === 'arrived' ? 'bg-blue-100 text-blue-700' :
                  inc.response_status === 'accepted' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{inc.response_status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
