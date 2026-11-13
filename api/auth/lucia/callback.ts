import { readLuciaConfig,fetchOidcDiscovery,exchangeLuciaCode,validateLuciaIdToken,fetchLuciaUserInfo,openOAuthTransaction,parseCookies,buildCookie,clearCookie,luciaCookieNames } from '../../_lib/lucia-oauth';
import { establishLuciaSession } from '../../_lib/lucia-session';
import { createRuntimePostgres } from '../../_lib/postgres-pool';
import { sendError,sendMethodNotAllowed,type ApiRequest,type ApiResponse } from '../../_lib/http';

function header(request:ApiRequest,name:string):string|undefined {
  const value=request.headers?.[name]??request.headers?.[name.toLowerCase()];
  return Array.isArray(value)?value[0]:value;
}
function query(url:string|undefined):URLSearchParams { return new URL(url??'/api/auth/lucia/callback','https://ariovelle.invalid').searchParams; }
export default async function luciaCallback(request:ApiRequest,response:ApiResponse) {
  if(request.method!=='GET') return sendMethodNotAllowed(response,['GET']);
  if(process.env.LUCIA_AUTH_ENABLED!=='true') return sendError(response,404,'AUTH_DISABLED','Sign-in is not enabled.');
  let config;
  try { config=readLuciaConfig(process.env); } catch { return sendError(response,503,'AUTH_NOT_CONFIGURED','Lucia sign-in is not configured.'); }
  const cookies=parseCookies(header(request,'cookie'));
  try {
    const tx=openOAuthTransaction(cookies[luciaCookieNames.transaction]??'',config.sessionSecret);
    const params=query(request.url);
    const returnedState=params.get('state')??'';
    if(!returnedState||!params.get('code')||!((await import('../../_lib/lucia-oauth')).constantTimeEqual(returnedState,tx.state))) throw new Error('invalid callback');
    const discovery=await fetchOidcDiscovery(config);
    const tokens=await exchangeLuciaCode({config,discovery,code:params.get('code')!,verifier:tx.verifier});
    const claims=await validateLuciaIdToken({token:tokens.id_token!,config,discovery,nonce:tx.nonce});
    const profile=await fetchLuciaUserInfo({discovery,accessToken:tokens.access_token!,expectedSubject:claims.sub!});
    const databaseUrl=process.env.DATABASE_URL;
    if(!databaseUrl) throw new Error('database unavailable');
    const {pool,database}=createRuntimePostgres(databaseUrl);
    try {
      const established=await establishLuciaSession(database,{issuer:config.issuer,subject:claims.sub!,email:typeof profile.email==='string'?profile.email:undefined,emailVerified:profile.email_verified===true,displayName:typeof profile.name==='string'?profile.name:undefined,ttlSeconds:60*60*24*14});
      response.setHeader('Cache-Control','no-store'); response.setHeader('Referrer-Policy','no-referrer');
      response.setHeader('Set-Cookie',[
        clearCookie(luciaCookieNames.transaction,config.environment==='production'),
        buildCookie(luciaCookieNames.session,established.session.token,{maxAge:60*60*24*14,secure:config.environment==='production'})
      ]);
      response.setHeader('Location','/'); response.status(302).json({authenticated:true});
    } finally { await pool.end(); }
  } catch {
    response.setHeader('Set-Cookie',clearCookie(luciaCookieNames.transaction,config.environment==='production'));
    sendError(response,401,'AUTHENTICATION_FAILED','Lucia sign-in could not be completed. Please try again.');
  }
}
