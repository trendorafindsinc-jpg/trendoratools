export type RuntimeEnvironment = 'development' | 'test' | 'production';

export type ServerConfig = {
  environment: RuntimeEnvironment;
  databaseUrl: string | null;
};

export class ServerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerConfigError';
  }
}

/**
 * Parse server-only environment variables without reading process.env at module
 * load time. DATABASE_URL is optional until a database adapter is approved.
 * Never pass this configuration to browser code or include it in API responses.
 */
export function readServerConfig(
  env: Record<string, string | undefined>,
): ServerConfig {
  const rawEnvironment = env.NODE_ENV ?? 'development';
  if (
    rawEnvironment !== 'development' &&
    rawEnvironment !== 'test' &&
    rawEnvironment !== 'production'
  ) {
    throw new ServerConfigError('NODE_ENV must be development, test, or production.');
  }

  const rawDatabaseUrl = env.DATABASE_URL?.trim() ?? '';
  if (!rawDatabaseUrl) {
    return { environment: rawEnvironment, databaseUrl: null };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawDatabaseUrl);
  } catch {
    throw new ServerConfigError('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new ServerConfigError('DATABASE_URL must use postgres:// or postgresql://.');
  }
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
    throw new ServerConfigError('DATABASE_URL must include a host and database name.');
  }

  return { environment: rawEnvironment, databaseUrl: rawDatabaseUrl };
}
