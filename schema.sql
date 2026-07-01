CREATE TABLE IF NOT EXISTS responders (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  qualifications TEXT DEFAULT '[]',
  latitude REAL,
  longitude REAL,
  is_available INTEGER DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  reported_by TEXT DEFAULT 'Anonymous',
  type TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  incident_id TEXT REFERENCES incidents(id),
  responder_id TEXT REFERENCES responders(id),
  status TEXT DEFAULT 'notified',
  notified_at TEXT DEFAULT (datetime('now')),
  responded_at TEXT,
  arrived_at TEXT
);

CREATE TABLE IF NOT EXISTS aed_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  is_verified INTEGER DEFAULT 1,
  added_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Seed AED locations (Singapore CBD & surrounds)
INSERT OR IGNORE INTO aed_locations (id, name, address, latitude, longitude) VALUES
  ('aed-01', 'Marina Bay Sands Lobby', '10 Bayfront Ave, Singapore 018956', 1.2838, 103.8591),
  ('aed-02', 'Raffles Place MRT Station', 'Raffles Place, Singapore 048616', 1.2842, 103.8516),
  ('aed-03', 'Orchard MRT Station Concourse', '437 Orchard Rd, Singapore 238878', 1.3013, 103.8322),
  ('aed-04', 'Changi Airport T3 Arrival Hall', '65 Airport Blvd, Singapore 819663', 1.3526, 103.9872),
  ('aed-05', 'NUS University Cultural Centre', '50 Kent Ridge Cres, Singapore 119279', 1.2966, 103.7764),
  ('aed-06', 'Tampines Hub Community Centre', '1 Tampines Walk, Singapore 528523', 1.3528, 103.9433),
  ('aed-07', 'Woodlands Civic Centre', '900 S Woodlands Dr, Singapore 730900', 1.4366, 103.7864),
  ('aed-08', 'Jurong East MRT Station', '10 Jurong East St 12, Singapore 609691', 1.3330, 103.7422);
