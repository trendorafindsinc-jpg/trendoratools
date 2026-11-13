import { createHash, createPublicKey, randomBytes, verify as verifySignature, createCipheriv, createDecipheriv, timingSafeEqual } from 'node:crypto';

export type LuciaConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  audience: string;
  redirectUri: string;
  sessionSecret: string;
  enabled: boolean;
  environment: 'development' | 'test' | 'production';
};

export class LuciaAuthError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'LuciaAuthError'; }
}
export type OidcDiscovery = {
  issuer: string; authorization_endpoint: string; token_endpoint: string;
  userinfo_endpoint: string; jwks_uri: string; response_types_supported: string[];
  id_token_signing_alg_values_supported: string[]; code_challenge_methods_supported: string[];
};
type JwtClaims = { iss?: string; sub?: string; aud?: string | string[]; exp?: number; iat?: number; nonce?: string; [key: string]: unknown };
type Jwk = { kty: string; kid: string; alg?: string; use?: string; n?: string; e?: string };

function required(value: string | undefined, name: string): string {
  const result = value?.trim();
  if (!result) throw new LuciaAuthError('AUTH_NOT_CONFIGURED', name + ' is not configured.');
  return result;
}
export function readLuciaConfig(env: Record<string,string|undefined>): LuciaConfig {
  const environment = env.NODE_ENV === 'production' ? 'production' : env.NODE_ENV === 'test' ? 'test' : 'development';
  const issuer = required(env.LUCIA_ISSUER, 'LUCIA_ISSUER');
  let parsed: URL;
  try { parsed = new URL(issuer); } catch { throw new LuciaAuthError('INVALID_CONFIG','LUCIA_ISSUER must be an absolute URL.'); }
  if (parsed.protocol !== 'https:' && !(environment !== 'production' && parsed.hostname === 'localhost')) throw new LuciaAuthError('INVALID_CONFIG','LUCIA_ISSUER must use HTTPS.');
  if (parsed.origin !== issuer.replace(/\/$/, '') || parsed.search || parsed.hash) throw new LuciaAuthError('INVALID_CONFIG','LUCIA_ISSUER must be a canonical origin without query or fragment.');
  const enabled = env.LUCIA_AUTH_ENABLED === 'true';
  const clientId = env.LUCIA_CLIENT_ID?.trim() ?? '';
  const clientSecret = env.LUCIA_CLIENT_SECRET ?? '';
  const audience = env.LUCIA_AUDIENCE?.trim() ?? '';
  const redirectUri = env.LUCIA_REDIRECT_URI?.trim() ?? '';
  const sessionSecret = env.ARIOVELLE_SESSION_SECRET ?? '';
  if (enabled) {
    required(clientId,'LUCIA_CLIENT_ID'); required(clientSecret,'LUCIA_CLIENT_SECRET');
    required(audience,'LUCIA_AUDIENCE'); required(sessionSecret,'ARIOVELLE_SESSION_SECRET');
    if (clientSecret.length < 32 || sessionSecret.length < 32) throw new LuciaAuthError('INVALID_CONFIG','OAuth client and session secrets must each be at least 32 characters.');
    let redirect: URL;
    try { redirect = new URL(required(redirectUri,'LUCIA_REDIRECT_URI')); } catch { throw new LuciaAuthError('INVALID_CONFIG','LUCIA_REDIRECT_URI must be an absolute URL.'); }
    if (environment === 'production' && redirect.protocol !== 'https:') throw new LuciaAuthError('INVALID_CONFIG','Production OAuth callback must use HTTPS.');
  }
  return { issuer: parsed.origin, clientId, clientSecret, audience, redirectUri, sessionSecret, enabled, environment };
}
function b64url(input: Buffer | string): string { return Buffer.from(input).toString('base64url'); }
function decodePart<T>(part: string): T {
  try { return JSON.parse(Buffer.from(part,'base64url').toString('utf8')) as T; }
  catch { throw new LuciaAuthError('INVALID_TOKEN','Malformed token.'); }
}
export function createPkcePair() {
  const verifier = b64url(randomBytes(32));
  return { verifier, challenge: b64url(createHash('sha256').update(verifier).digest()) };
}
export type OAuthTransaction = { state:string; nonce:string; verifier:string; createdAt:number };
const TX_COOKIE = 'ariovelle_oauth_tx';
const SESSION_COOKIE = 'ariovelle_session';
export const luciaCookieNames = { transaction: TX_COOKIE, session: SESSION_COOKIE };
function encryptionKey(secret:string):Buffer { return createHash('sha256').update(secret).digest(); }
export function sealOAuthTransaction(tx:OAuthTransaction, secret:string):string {
  const iv=randomBytes(12), key=encryptionKey(secret), cipher=createCipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(Buffer.from('ariovelle-oauth-transaction-v1'));
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(tx),'utf8'),cipher.final()]);
  return [iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),ciphertext.toString('base64url')].join('.');
}
export function openOAuthTransaction(value:string,secret:string,now=Date.now()):OAuthTransaction {
  try {
    const [iv,tag,data]=value.split('.');
    if(!iv||!tag||!data) throw new Error();
    const decipher=createDecipheriv('aes-256-gcm',encryptionKey(secret),Buffer.from(iv,'base64url'));
    decipher.setAAD(Buffer.from('ariovelle-oauth-transaction-v1')); decipher.setAuthTag(Buffer.from(tag,'base64url'));
    const tx=JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8')) as OAuthTransaction;
    if(!tx.state||!tx.nonce||!tx.verifier||!Number.isSafeInteger(tx.createdAt)||now-tx.createdAt>10*60_000||tx.createdAt>now+30_000) throw new Error();
    return tx;
  } catch { throw new LuciaAuthError('INVALID_OAUTH_TRANSACTION','OAuth transaction is invalid, expired or has been tampered with.'); }
}
export function constantTimeEqual(a:string,b:string):boolean {
  const aa=Buffer.from(a),bb=Buffer.from(b);
  return aa.length===bb.length && timingSafeEqual(aa,bb);
}
export function buildCookie(name:string,value:string,options:{maxAge:number;secure:boolean;httpOnly?:boolean;sameSite?:string}):string {
  return name+'='+value+'; Path=/; Max-Age='+options.maxAge+'; HttpOnly; SameSite='+(options.sameSite??'Lax')+(options.secure?'; Secure':'');
}
export function clearCookie(name:string,secure:boolean):string {
  return name+'=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'+(secure?'; Secure':'');
}
export function parseCookies(header:string|undefined):Record<string,string> {
  const result:Record<string,string>={};
  for(const item of (header??'').split(';')) { const i=item.indexOf('='); if(i>0) result[item.slice(0,i).trim()]=item.slice(i+1).trim(); }
  return result;
}
export async function fetchOidcDiscovery(config:LuciaConfig,fetcher:typeof fetch=fetch):Promise<OidcDiscovery> {
  const response=await fetcher(config.issuer+'/.well-known/openid-configuration',{headers:{Accept:'application/json'},cache:'no-store',redirect:'error'});
  if(!response.ok) throw new LuciaAuthError('OIDC_DISCOVERY_FAILED','Lucia Core discovery could not be loaded.');
  const doc=await response.json() as OidcDiscovery;
  if(doc.issuer!==config.issuer) throw new LuciaAuthError('OIDC_ISSUER_MISMATCH','Lucia Core discovery issuer does not match the configured issuer.');
  for(const [key,path] of [['authorization_endpoint','/api/v1/consumer/oauth/authorize'],['token_endpoint','/api/v1/consumer/oauth/token'],['userinfo_endpoint','/api/v1/oidc/userinfo'],['jwks_uri','/.well-known/jwks.json']] as const) {
    const u=new URL(doc[key]);
    if(u.origin!==config.issuer || u.pathname!==path || u.search || u.hash) throw new LuciaAuthError('OIDC_ENDPOINT_MISMATCH','Lucia Core advertised an unexpected OIDC endpoint.');
  }
  if(!doc.response_types_supported.includes('code')||!doc.id_token_signing_alg_values_supported.includes('RS256')||!doc.code_challenge_methods_supported.includes('S256')) throw new LuciaAuthError('OIDC_CAPABILITY_MISMATCH','Lucia Core does not advertise the required authorization-code, RS256 and S256 capabilities.');
  return doc;
}
export async function exchangeLuciaCode(input:{config:LuciaConfig;discovery:OidcDiscovery;code:string;verifier:string;fetcher?:typeof fetch}) {
  const form=new URLSearchParams({grant_type:'authorization_code',code:input.code,redirect_uri:input.config.redirectUri,audience:input.config.audience,code_verifier:input.verifier});
  const basic=Buffer.from(input.config.clientId+':'+input.config.clientSecret).toString('base64');
  const response=await (input.fetcher??fetch)(input.discovery.token_endpoint,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded',Authorization:'Basic '+basic},body:form,cache:'no-store',redirect:'error'});
  if(!response.ok) throw new LuciaAuthError('TOKEN_EXCHANGE_FAILED','Lucia Core rejected the authorization-code exchange.');
  const body=await response.json() as {access_token?:string;id_token?:string;token_type?:string;expires_in?:number;scope?:string};
  if(!body.access_token||!body.id_token||body.token_type?.toLowerCase()!=='bearer') throw new LuciaAuthError('TOKEN_RESPONSE_INVALID','Lucia Core did not return the required OIDC ID token and bearer access token.');
  return body;
}
export async function validateLuciaIdToken(input:{token:string;config:LuciaConfig;discovery:OidcDiscovery;nonce:string;fetcher?:typeof fetch;now?:number}) {
  const parts=input.token.split('.');
  if(parts.length!==3) throw new LuciaAuthError('INVALID_ID_TOKEN','ID token is malformed.');
  const header=decodePart<{alg?:string;kid?:string;typ?:string}>(parts[0]);
  const claims=decodePart<JwtClaims>(parts[1]);
  if(header.alg!=='RS256'||!header.kid) throw new LuciaAuthError('INVALID_ID_TOKEN','ID token algorithm or key identifier is not accepted.');
  const now=Math.floor((input.now??Date.now())/1000);
  if(claims.iss!==input.config.issuer||!(typeof claims.aud==='string'?claims.aud===input.config.clientId:Array.isArray(claims.aud)&&claims.aud.includes(input.config.clientId))) throw new LuciaAuthError('INVALID_ID_TOKEN','ID token issuer or audience is invalid.');
  if(typeof claims.sub!=='string'||!claims.sub||typeof claims.exp!=='number'||claims.exp<=now||typeof claims.iat!=='number'||claims.iat>now+30||claims.iat<now-600||claims.exp-claims.iat>600) throw new LuciaAuthError('INVALID_ID_TOKEN','ID token subject or lifetime is invalid.');
  if(typeof claims.nonce!=='string'||!constantTimeEqual(claims.nonce,input.nonce)) throw new LuciaAuthError('INVALID_ID_TOKEN','ID token nonce is missing or does not match.');
  const fetcher=input.fetcher??fetch;
  const getKeys=async()=> {
    const res=await fetcher(input.discovery.jwks_uri,{headers:{Accept:'application/json'},cache:'no-store',redirect:'error'});
    if(!res.ok) throw new LuciaAuthError('JWKS_UNAVAILABLE','Lucia Core signing keys could not be loaded.');
    return (await res.json() as {keys:Jwk[]}).keys;
  };
  let keys=await getKeys(), jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256'&&(!k.use||k.use==='sig'));
  if(!jwk) { keys=await getKeys(); jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256'&&(!k.use||k.use==='sig')); }
  if(!jwk) throw new LuciaAuthError('UNKNOWN_SIGNING_KEY','Lucia Core ID token signing key is unknown.');
  let valid=false;
  try { const key=createPublicKey({key:jwk as JsonWebKey,format:'jwk'}); valid=verifySignature('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),key,Buffer.from(parts[2],'base64url')); } catch { valid=false; }
  if(!valid) throw new LuciaAuthError('INVALID_ID_TOKEN','ID token signature verification failed.');
  return claims;
}
export async function fetchLuciaUserInfo(input:{discovery:OidcDiscovery;accessToken:string;expectedSubject:string;fetcher?:typeof fetch}) {
  const response=await (input.fetcher??fetch)(input.discovery.userinfo_endpoint,{headers:{Accept:'application/json',Authorization:'Bearer '+input.accessToken},cache:'no-store',redirect:'error'});
  if(!response.ok) throw new LuciaAuthError('USERINFO_FAILED','Lucia Core UserInfo request failed.');
  const claims=await response.json() as {sub?:string;email?:string;email_verified?:boolean;name?:string};
  if(!claims.sub||!constantTimeEqual(claims.sub,input.expectedSubject)) throw new LuciaAuthError('USERINFO_SUBJECT_MISMATCH','Lucia Core UserInfo subject does not match the validated ID token.');
  return claims;
}
