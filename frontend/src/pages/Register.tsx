import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

const ROLES = [
  { value: 'doctor', label: 'Doctor / Physician' },
  { value: 'nurse', label: 'Nurse / Midwife' },
  { value: 'paramedic', label: 'Paramedic / EMT' },
  { value: 'first_aider', label: 'Certified First Aider' },
  { value: 'other', label: 'Other (trained responder)' },
];

const QUALS = ['CPR Certified', 'AED Certified', 'Basic Life Support (BLS)', 'Advanced Life Support (ALS)', 'ACLS', 'ATLS', 'Wilderness First Aid', 'Paediatric First Aid', 'Mental Health First Aid'];

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: '', qualifications: [] as string[] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleQual = (q: string) => {
    setForm(f => ({
      ...f,
      qualifications: f.qualifications.includes(q) ? f.qualifications.filter(x => x !== q) : [...f.qualifications, q],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) { setError('Please select your role'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.auth.register(form);
      login(res.token, res.user);
      nav('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚑</div>
          <h1 className="text-3xl font-bold text-gray-900">Join the Registry</h1>
          <p className="text-gray-500 mt-2">Register as a community first responder</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Dr. Sarah Lee"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="+65 9123 4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (min 8 chars)</label>
            <input
              type="password" required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
            <select
              required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select role...</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {QUALS.map(q => (
                <button
                  type="button" key={q} onClick={() => toggleQual(q)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    form.qualifications.includes(q)
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-gray-300 text-gray-600 hover:border-red-400'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            By registering you agree to respond only when safe and available to do so. Response is entirely voluntary.
          </p>

          <button
            type="submit" disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already registered? <Link to="/login" className="text-red-600 hover:underline font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
