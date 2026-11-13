import { describe,expect,it,vi } from 'vitest';
import { generateKeyPairSync,sign } from 'node:crypto';
import { buildCookie,constantTimeEqual,createPkcePair,fetchOidcDiscovery,openOAuthTransaction,readLuciaConfig,sealOAuthTransaction,validateLuciaIdToken,type OidcDiscovery } from './lucia-oauth';

const env={NODE_ENV:'test',LUCIA_AUTH_ENABLED:'true',LUCIA_ISSUER:'https://identity.example.test',LUCIA_CLIENT_ID:'ariovelle-client',LUCIA_CLIENT_SECRET:'x'.repeat(40),LUCIA_AUDIENCE:'ariovelle',LUCIA_REDIRECT_URI:'https://ariovelle.example.test/api/auth/lucia/callback',ARIOVELLE_SESSION_SECRET:'s'.repeat(48)};
const config=readLuciaConfig(env);
const discovery:OidcDiscovery={issuer:config.issuer,authorization_endpoint:config.issuer+'/api/v1/consumer/oauth/authorize',token_endpoint:config.issuer+'/api/v1/consumer/oauth/token',userinfo_endpoint:config.issuer+'/api/v1/oidc/userinfo',jwks_uri:config.issuer+'/.well-known/jwks.json',response_types_supported:['code'],id_token_signing_alg_values_supported:['RS256'],code_challenge_methods_supported:['S256']};
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...(publicKey.export({format:'jwk'}) as JsonWebKey),kid:'test-key',kty:'RSA',alg:'RS256',use:'sig'};
function token(claims:Record<string,unknown>,alg='RS256') {
 const h=Buffer.from(JSON.stringify({alg,kid:'test-key',typ:'JWT'})).toString('base64url');
 const p=Buffer.from(JSON.stringify(claims)).toString('base64url');
 const input=h+'.'+p;
 return input+'.'+sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
}
const fetchJwks=vi.fn(async()=>new Response(JSON.stringify({keys:[jwk]}),{status:200,headers:{'Content-Type':'application/json'}})) as unknown as typeof fetch;

describe('Lucia OIDC adapter',()=>{
 it('requires explicit server-side configuration and HTTPS in production',()=>{
  expect(()=>readLuciaConfig({NODE_ENV:'production',LUCIA_AUTH_ENABLED:'true',LUCIA_ISSUER:'http://identity.example.test'})).toThrow(/HTTPS/);
  expect(()=>readLuciaConfig({...env,LUCIA_CLIENT_SECRET:'short'})).toThrow(/32 characters/);
 });
 it('creates an S256 PKCE pair',()=>{
  const pair=createPkcePair();
  expect(pair.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(pair.challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(pair.challenge).not.toBe(pair.verifier);
 });
 it('encrypts and authenticates the OAuth transaction cookie',()=>{
  const tx={state:'state-value',nonce:'nonce-value',verifier:'v'.repeat(43),createdAt:Date.now()};
  const sealed=sealOAuthTransaction(tx,config.sessionSecret);
  expect(openOAuthTransaction(sealed,config.sessionSecret)).toEqual(tx);
  expect(()=>openOAuthTransaction(sealed.slice(0,-2)+'xx',config.sessionSecret)).toThrow();
  expect(()=>openOAuthTransaction(sealed,'different secret')).toThrow();
 });
 it('uses exact OIDC endpoints and rejects issuer mismatch',async()=>{
  const fetcher=vi.fn(async()=>new Response(JSON.stringify(discovery),{status:200})) as unknown as typeof fetch;
  await expect(fetchOidcDiscovery(config,fetcher)).resolves.toMatchObject({issuer:config.issuer});
  const wrong={...discovery,issuer:'https://attacker.example'};
  const bad=vi.fn(async()=>new Response(JSON.stringify(wrong),{status:200})) as unknown as typeof fetch;
  await expect(fetchOidcDiscovery(config,bad)).rejects.toMatchObject({code:'OIDC_ISSUER_MISMATCH'});
 });
 it('validates RS256 signature, issuer, audience, lifetime and nonce',async()=>{
  const now=Math.floor(Date.now()/1000);
  const jwt=token({iss:config.issuer,sub:'stable-lucia-subject',aud:config.clientId,iat:now,exp:now+300,nonce:'expected-nonce'});
  const claims=await validateLuciaIdToken({token:jwt,config,discovery,nonce:'expected-nonce',fetcher:fetchJwks});
  expect(claims.sub).toBe('stable-lucia-subject');
  await expect(validateLuciaIdToken({token:jwt,config,discovery,nonce:'wrong',fetcher:fetchJwks})).rejects.toMatchObject({code:'INVALID_ID_TOKEN'});
  const wrongAud=token({iss:config.issuer,sub:'subject',aud:'other-client',iat:now,exp:now+300,nonce:'expected-nonce'});
  await expect(validateLuciaIdToken({token:wrongAud,config,discovery,nonce:'expected-nonce',fetcher:fetchJwks})).rejects.toMatchObject({code:'INVALID_ID_TOKEN'});
 });
 it('rejects a missing nonce and unsupported algorithm',async()=>{
  const now=Math.floor(Date.now()/1000);
  const noNonce=token({iss:config.issuer,sub:'subject',aud:config.clientId,iat:now,exp:now+300});
  await expect(validateLuciaIdToken({token:noNonce,config,discovery,nonce:'required',fetcher:fetchJwks})).rejects.toMatchObject({code:'INVALID_ID_TOKEN'});
  const wrongAlg=token({iss:config.issuer,sub:'subject',aud:config.clientId,iat:now,exp:now+300,nonce:'required'},'HS256');
  await expect(validateLuciaIdToken({token:wrongAlg,config,discovery,nonce:'required',fetcher:fetchJwks})).rejects.toMatchObject({code:'INVALID_ID_TOKEN'});
 });
 it('compares state safely and builds HttpOnly SameSite cookies',()=>{
  expect(constantTimeEqual('abc','abc')).toBe(true);
  expect(constantTimeEqual('abc','abd')).toBe(false);
  expect(buildCookie('ariovelle_session','secret',{maxAge:60,secure:true})).toContain('HttpOnly; SameSite=Lax; Secure');
 });
});
