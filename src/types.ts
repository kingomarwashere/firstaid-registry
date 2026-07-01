export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_KEY: string;
  ASSETS: Fetcher;
};

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  is_admin: number;
  iat: number;
  exp: number;
}
