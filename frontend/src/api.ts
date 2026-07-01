const BASE = '/api';

function token() {
  return localStorage.getItem('fa_token') ?? '';
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  auth: {
    register: (body: object) => req<{ token: string; user: any }>('POST', '/auth/register', body),
    login: (body: object) => req<{ token: string; user: any }>('POST', '/auth/login', body),
  },
  me: {
    get: () => req<any>('GET', '/responders/me'),
    update: (body: object) => req<any>('PUT', '/responders/me', body),
    setStatus: (is_available: boolean) => req<any>('PUT', '/responders/me/status', { is_available }),
    setLocation: (latitude: number, longitude: number) => req<any>('PUT', '/responders/me/location', { latitude, longitude }),
    incidents: () => req<any[]>('GET', '/responders/me/incidents'),
  },
  incidents: {
    list: () => req<any[]>('GET', '/incidents'),
    get: (id: string) => req<any>('GET', `/incidents/${id}`),
    create: (body: object) => req<any>('POST', '/incidents', body),
    respond: (id: string, status: string) => req<any>('POST', `/incidents/${id}/respond`, { status }),
    resolve: (id: string) => req<any>('PUT', `/incidents/${id}/resolve`),
    cancel: (id: string) => req<any>('PUT', `/incidents/${id}/cancel`),
    all: () => req<any[]>('GET', '/incidents/all'),
  },
  aeds: {
    list: () => req<any[]>('GET', '/aeds'),
    create: (body: object) => req<any>('POST', '/aeds', body),
  },
  admin: {
    stats: () => req<any>('GET', '/admin/stats'),
    responders: () => req<any[]>('GET', '/admin/responders'),
    verify: (id: string, is_verified: boolean) => req<any>('PUT', `/admin/responders/${id}/verify`, { is_verified }),
    setAdmin: (id: string, is_admin: boolean) => req<any>('PUT', `/admin/responders/${id}/admin`, { is_admin }),
    bootstrap: (email: string, admin_key: string) => req<any>('POST', '/admin/bootstrap', { email, admin_key }),
  },
};
