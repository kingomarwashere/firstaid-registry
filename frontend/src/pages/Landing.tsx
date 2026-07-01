import { Link } from 'react-router-dom';
import { useAuth } from '../App';

const STATS = [
  { value: '10%', label: 'Survival drops per minute without CPR' },
  { value: '8–12 min', label: 'Average urban ambulance response time' },
  { value: '3×', label: 'Survival improvement with bystander CPR' },
  { value: '250,000+', label: 'Registered CFRs in Singapore alone' },
];

const FEATURES = [
  {
    icon: '📡',
    title: 'Real-Time Geofenced Alerts',
    desc: 'Incidents trigger instant notifications to all available, verified responders within a configurable radius. Zero manual dispatch required.',
  },
  {
    icon: '🔬',
    title: 'Credential Verification Workflow',
    desc: 'Admin-controlled vetting pipeline ensures every active responder holds genuine qualifications — CPR, AED, BLS, ACLS, clinical registration.',
  },
  {
    icon: '🗺️',
    title: 'Live Operational Map',
    desc: 'Command centre view of active incidents, responding personnel, AED locations, and coverage gaps — updated in real time.',
  },
  {
    icon: '📊',
    title: 'Reporting & Audit Trail',
    desc: 'Full timestamped log of every alert, response, arrival, and resolution. Exportable for post-incident review and KPI reporting.',
  },
  {
    icon: '🔗',
    title: 'CAD-Ready Architecture',
    desc: 'REST API designed for integration with existing Computer-Aided Dispatch systems. Responder alerts can be triggered directly from your dispatch console.',
  },
  {
    icon: '🔒',
    title: 'Government-Grade Security',
    desc: 'End-to-end encryption, PBKDF2 password hashing, short-lived JWT sessions, and Cloudflare infrastructure with 99.99% uptime SLA.',
  },
];

const RESULTS = [
  { value: '250,000+', label: 'Registered community first responders', sub: 'Singapore SCDF myResponder, 2025' },
  { value: '< 4 min', label: 'Average CFR response time in trials', sub: 'vs. 8–12 min for ambulance alone' },
  { value: '2.4×', label: 'Improvement in OHCA survival rate', sub: 'When CFR arrives before ambulance' },
  { value: '67%', label: 'Of incidents had CFR on scene first', sub: 'Urban deployment, Singapore 2023' },
];

const IMPLEMENTATION = [
  { n: '01', title: 'Deployment', time: 'Week 1–2', desc: 'Platform configured for your jurisdiction. Branding, alert radius, incident types, and integration endpoints tailored to your service.' },
  { n: '02', title: 'Onboarding', time: 'Week 2–4', desc: 'Bulk import of existing volunteer registries. Verification workflow activated. Admin and dispatch operator training delivered.' },
  { n: '03', title: 'Launch', time: 'Week 4', desc: 'Go live with your existing ambulance CAD system in parallel. Responders begin receiving live incident alerts.' },
  { n: '04', title: 'Scale', time: 'Ongoing', desc: 'Quarterly review of response metrics, coverage maps, and responder pool growth. Platform updates included.' },
];

export default function Landing() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current"><path d="M19 8h-2V6a5 5 0 00-10 0v2H5a1 1 0 00-1 1v11a2 2 0 002 2h12a2 2 0 002-2V9a1 1 0 00-1-1zM9 6a3 3 0 016 0v2H9V6zm4 10.7V18h-2v-1.3A2 2 0 1113 16.7z"/></svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">FirstAid Registry</span>
            <span className="text-slate-400 text-xs border border-slate-600 px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline">Emergency Response Platform</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            <a href="#results" className="hover:text-white transition-colors">Results</a>
            <a href="#implementation" className="hover:text-white transition-colors">Implementation</a>
          </nav>
          <div className="flex items-center gap-3">
            {token ? (
              <Link to="/dashboard" className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white text-sm transition-colors">Sign In</Link>
                <Link to="/register" className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors">Join Registry</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-slate-900 pt-16">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              Proven in deployment — Singapore SCDF myResponder Programme
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
              The first 4 minutes<br />
              <span className="text-red-500">determine everything.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-4 max-w-2xl leading-relaxed">
              Out-of-hospital cardiac arrest kills 3 in 4 victims — not because help isn't near, but because it hasn't been mobilised.
            </p>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl">
              FirstAid Registry is the community emergency response platform that alerts trained bystanders to life-threatening incidents the moment a call is placed — before your ambulance has even dispatched.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#implementation" className="bg-red-600 text-white px-8 py-4 rounded font-semibold text-lg hover:bg-red-700 transition-colors inline-block text-center">
                Request a Briefing
              </a>
              <Link to="/register" className="border border-slate-500 text-slate-300 px-8 py-4 rounded font-semibold text-lg hover:border-slate-300 hover:text-white transition-colors text-center">
                View Live Platform
              </Link>
            </div>
          </div>
        </div>

        {/* Stat bar */}
        <div className="border-t border-slate-700 bg-slate-800/50">
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-slate-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem framing */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-red-600 font-semibold text-sm uppercase tracking-wider mb-4">The Gap Your Service Cannot Close Alone</p>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                Ambulances cannot be everywhere. Your community can be.
              </h2>
              <p className="text-slate-600 text-lg mb-6">
                Every ambulance service operates with finite resources. During peak demand, major events, or in rural corridors with extended response times, the window between incident and arrival widens — and survival rates drop accordingly.
              </p>
              <p className="text-slate-600 text-lg mb-8">
                FirstAid Registry mobilises your community's hidden clinical workforce: the nurses on their lunch break, the paramedics off-shift, the CPR-certified office workers. They receive a geo-targeted alert the moment dispatch logs a call — and they're often on scene in under four minutes.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { val: '75%', txt: 'OHCA victims die before ambulance arrives' },
                  { val: '4 min', txt: 'Window for effective CPR intervention' },
                  { val: '10%', txt: 'Survival drop per minute of delay' },
                  { val: '40%', txt: 'Survival rate with immediate bystander CPR' },
                ].map(item => (
                  <div key={item.txt} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="text-2xl font-extrabold text-red-600 mb-1">{item.val}</div>
                    <div className="text-slate-600 text-sm">{item.txt}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-8 text-white">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-6">Cardiac Arrest Survival by Response Time</p>
              <div className="space-y-4">
                {[
                  { time: '0–2 min', rate: 90, bar: 'bg-emerald-500' },
                  { time: '2–4 min', rate: 67, bar: 'bg-emerald-400' },
                  { time: '4–6 min', rate: 45, bar: 'bg-yellow-400' },
                  { time: '6–8 min', rate: 28, bar: 'bg-orange-500' },
                  { time: '8–10 min', rate: 15, bar: 'bg-red-500' },
                  { time: '10+ min', rate: 6, bar: 'bg-red-700' },
                ].map(row => (
                  <div key={row.time} className="flex items-center gap-4">
                    <div className="text-slate-400 text-sm w-20 shrink-0">{row.time}</div>
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${row.bar}`} style={{ width: `${row.rate}%` }}></div>
                    </div>
                    <div className="text-white font-semibold text-sm w-12 text-right">{row.rate}%</div>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-6">Source: Circulation, American Heart Association · Resuscitation journal</p>
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-slate-300 text-sm">Average ambulance response time:</p>
                <div className="flex gap-6 mt-2">
                  <div><span className="text-white font-bold">8–12 min</span><span className="text-slate-400 text-xs ml-2">Urban</span></div>
                  <div><span className="text-red-400 font-bold">15–25 min</span><span className="text-slate-400 text-xs ml-2">Rural / traffic</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section id="platform" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-wider mb-3">Platform Capabilities</p>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Built for operational deployment</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Every capability was designed around the realities of emergency dispatch operations and government procurement requirements.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-red-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proven results / case study */}
      <section id="results" className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-4">Proven at Scale</p>
              <h2 className="text-4xl font-extrabold mb-6">Singapore set the benchmark.<br />Now it can be yours.</h2>
              <p className="text-slate-300 text-lg mb-6">
                The Singapore Civil Defence Force's myResponder programme — on which this platform is modelled — is the world's most successful community first responder deployment. Launched in 2015 with 3,000 volunteers, it now activates a network of over 250,000 trained citizens across the island.
              </p>
              <p className="text-slate-400 mb-8">
                The programme has been independently validated, won international emergency services awards, and served as the evidence base for similar deployments in the UK, Australia, and Scandinavia.
              </p>
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <p className="text-slate-300 text-sm font-medium mb-1">"The myResponder app has transformed our ability to harness community goodwill in emergencies. Survival rates for out-of-hospital cardiac arrest have improved measurably since deployment."</p>
                <p className="text-slate-500 text-xs mt-2">— Singapore Civil Defence Force, Annual Review 2024</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {RESULTS.map(r => (
                <div key={r.label} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="text-3xl font-extrabold text-red-400 mb-2">{r.value}</div>
                  <div className="text-white font-medium text-sm mb-1">{r.label}</div>
                  <div className="text-slate-500 text-xs">{r.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For government / compliance */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-wider mb-3">For Government & Health Services</p>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Meets your procurement requirements</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Designed from the ground up for public-sector deployment — not an app adapted from consumer software.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Data Sovereignty',
                items: ['All data stored within Cloudflare regional infrastructure', 'No third-party analytics or advertising SDKs', 'GDPR-compatible data model by design', 'Data export and deletion on request'],
              },
              {
                title: 'Operational Reliability',
                items: ['99.99% uptime SLA via Cloudflare global edge', 'Zero cold-start latency on alert delivery', 'Graceful degradation — no single point of failure', 'Incident audit log with microsecond timestamps'],
              },
              {
                title: 'Integration & Control',
                items: ['REST API for CAD system integration', 'Admin role assignment with granular permissions', 'Configurable alert radius per incident type', 'Bulk responder import from existing registers'],
              },
            ].map(col => (
              <div key={col.title} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-lg mb-4">{col.title}</h3>
                <ul className="space-y-3">
                  {col.items.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation */}
      <section id="implementation" className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-3">Rapid Deployment</p>
            <h2 className="text-4xl font-extrabold mb-4">Operational in 4 weeks</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">No legacy infrastructure to rip out. Runs alongside your existing CAD and dispatch systems from day one.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {IMPLEMENTATION.map(step => (
              <div key={step.n} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-red-500 font-extrabold text-2xl">{step.n}</span>
                  <span className="text-slate-500 text-xs border border-slate-600 px-2 py-1 rounded">{step.time}</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-red-600 rounded-2xl p-10 text-center">
            <h3 className="text-3xl font-extrabold text-white mb-3">Ready to brief your team?</h3>
            <p className="text-red-100 text-lg mb-8 max-w-xl mx-auto">We provide full technical briefings, live platform demonstrations, and deployment proposals for ambulance services and government health authorities.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="bg-white text-red-700 px-8 py-4 rounded font-bold text-lg hover:bg-red-50 transition-colors">
                Access Live Demo
              </Link>
              <a href="mailto:contact@theradicalparty.com?subject=FirstAid Registry - Briefing Request" className="border-2 border-white text-white px-8 py-4 rounded font-bold text-lg hover:bg-red-700 transition-colors">
                Request Briefing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">+</span>
            </div>
            <span className="text-slate-400 font-semibold">FirstAid Registry</span>
          </div>
          <div className="text-sm text-center">
            Community Emergency Response Platform · Modelled on Singapore SCDF myResponder
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-slate-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
