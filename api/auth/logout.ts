import { createRuntimePostgres } from '../_lib/postgres-pool';
import { revokeLocalSession } from '../_lib/lucia-session';
import { clearCookie,luciaCookieNames,parseCookies } from '../_lib/lucia-oauth';
import { sendError,sendMethodNotAllowed,type ApiRequest,type ApiResponse } from '../_lib/http';

export default async function logout(request:ApiRequest,response:ApiResponse){
 if(request.method!=='POST') return sendMethodNotAllowed(response,['POST']);
 const header=request.headers?.cookie;
 const cookie=Array.isArray(header)?header[0]:header;
 const token=parseCookies(cookie)[luciaCookieNames.session];
 try{
  if(token&&!process.env.DATABASE_URL) return sendError(response,503,'SESSION_STORE_UNAVAILABLE','Your session store is unavailable. Please retry.');
  if(token&&process.env.DATABASE_URL){
   const {pool,database}=createRuntimePostgres(process.env.DATABASE_URL);
   try{await revokeLocalSession(database,token);}finally{await pool.end();}
  }
  response.setHeader('Cache-Control','no-store');
  response.setHeader('Set-Cookie',clearCookie(luciaCookieNames.session,process.env.NODE_ENV==='production'));
  response.status(200).json({signedOut:true});
 }catch{
  sendError(response,503,'SIGN_OUT_FAILED','Your session could not be revoked. Please retry.');
 }
}
