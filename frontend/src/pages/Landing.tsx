import { Link } from 'react-router-dom';
import { useAuth } from '../App';

const ROLES = [
  { icon: '🩺', label: 'Doctors', desc: 'Medical practitioners ready to assist' },
  { icon: '💊', label: 'Nurses', desc: 'Trained clinical care professionals' },
  { icon: '🚑', label: 'Paramedics & EMTs', desc: 'Pre-hospital emergency specialists' },
  { icon: '🩹', label: 'First Aiders', desc: 'CPR and basic life support certified' },
];

const STEPS = [
  { n: '1', title: 'Sign Up', desc: 'Register with your qualifications and location' },
  { n: '2', title: 'Go Available', desc: 'Toggle your status when ready to respond' },
  { n: '3', title: 'Get Alerted', desc: 'Receive instant alerts for emergencies within 5km' },
  { n: '4', title: 'Save Lives', desc: 'Respond and provide aid before the ambulance arrives' },
];

export default function Landing() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="bg-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <span className="text-xl font-bold">🚑 FirstAid Registry</span>
          <div className="flex gap-4">
            {token ? (
              <Link to="/dashboard" className="bg-white text-red-700 px-4 py-2 rounded-md font-medium hover:bg-red-50 transition-colors">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-red-100 hover:text-white font-medium transition-colors">Sign in</Link>
                <Link to="/register" className="bg-white text-red-700 px-4 py-2 rounded-md font-medium hover:bg-red-50 transition-colors">Join Registry</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-red-700 to-red-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">❤️‍🔥</div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">Every second counts.</h1>
          <p className="text-2xl text-red-100 mb-4 font-light">
            Trained citizens responding to emergencies before ambulances arrive.
          </p>
          <p className="text-lg text-red-200 mb-10 max-w-2xl mx-auto">
            Inspired by Singapore's SCDF myResponder programme — a network of community first responders
            who receive real-time alerts for nearby cardiac arrests, choking and trauma incidents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-red-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition-colors shadow-lg">
              Join as a Responder
            </Link>
            <Link to="/login" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-800 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-red-800 text-white py-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-12 text-center px-4">
          <div><div className="text-4xl font-extrabold">5 km</div><div className="text-red-200 text-sm mt-1">Alert radius</div></div>
          <div><div className="text-4xl font-extrabold">&lt;90s</div><div className="text-red-200 text-sm mt-1">Average response time</div></div>
          <div><div className="text-4xl font-extrabold">24/7</div><div className="text-red-200 text-sm mt-1">Always active</div></div>
          <div><div className="text-4xl font-extrabold">3×</div><div className="text-red-200 text-sm mt-1">Survival rate improvement</div></div>
        </div>
      </section>

      {/* Who can join */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Who can join?</h2>
          <p className="text-center text-gray-500 mb-12">Anyone with formal emergency or medical training</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map(r => (
              <div key={r.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-3">{r.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{r.label}</h3>
                <p className="text-gray-500 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">How it works</h2>
          <p className="text-center text-gray-500 mb-12">Simple, fast, life-saving</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(s => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">{s.n}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-red-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to save lives?</h2>
          <p className="text-red-200 mb-8 text-lg">Join the registry today. It costs nothing and could mean everything.</p>
          <Link to="/register" className="bg-white text-red-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition-colors inline-block shadow-lg">
            Register Now — It's Free
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        <p>First Aid Registry — Modelled on Singapore SCDF's myResponder Programme</p>
        <p className="mt-1">Respond voluntarily. Only when safe and available to do so.</p>
      </footer>
    </div>
  );
}
