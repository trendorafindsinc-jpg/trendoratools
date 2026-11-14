type ServerEnvironment = Record<string, string | undefined>;

const REQUIRED_IDENTITY_CONFIGURATION = [
  'LUCIA_ISSUER',
  'LUCIA_CLIENT_ID',
  'LUCIA_CLIENT_SECRET',
  'LUCIA_AUDIENCE',
  'LUCIA_REDIRECT_URI',
  'ARIOVELLE_SESSION_SECRET',
] as const;

/** Checks presence only. It does not validate provider reachability or credentials. */
export function isIdentityProviderConfigured(environment: ServerEnvironment): boolean {
  return REQUIRED_IDENTITY_CONFIGURATION.every((key) => Boolean(environment[key]?.trim()));
}
