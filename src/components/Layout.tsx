import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, BrainCircuit, Building2, ChartNoAxesCombined, ChevronDown, CircleHelp, FileChartColumnIncreasing, Gauge, Home, Landmark, LayoutDashboard, Menu, Moon, MoreHorizontal, PiggyBank, ReceiptText, Settings2, Sun, Target, Wallet, X } from 'lucide-react';
import { applyTheme, getStoredPreference, type ThemePreference } from '../lib/theme';

const groups = [
 { title:'Workspace', items:[{to:'/',label:'Overview',icon:LayoutDashboard}] },
 { title:'Manage money', items:[{to:'/expenses',label:'Transactions',icon:Wallet},{to:'/budget',label:'Budgets',icon:Gauge},{to:'/bills',label:'Bills & recurring',icon:ReceiptText},{to:'/savings',label:'Savings goals',icon:PiggyBank},{to:'/debts',label:'Debt management',icon:Landmark},{to:'/reports',label:'Reports',icon:FileChartColumnIncreasing}] },
 { title:'Intelligence', items:[{to:'/business',label:'Business finance',icon:Building2},{to:'/ai',label:'AI intelligence',icon:BrainCircuit},{to:'/markets',label:'Global markets',icon:ChartNoAxesCombined},{to:'/planning',label:'Financial planning',icon:Target}] }
];
const mobile=[{to:'/',label:'Home',icon:Home},{to:'/expenses',label:'Finance',icon:Wallet},{to:'/ai',label:'AI',icon:BrainCircuit},{to:'/markets',label:'Markets',icon:Activity}];

function ThemeButton(){
 const [pref,setPref]=useState<ThemePreference>(()=>getStoredPreference());
 const next=pref==='dark'?'light':'dark';
 return <button className="ari-icon-button" type="button" onClick={()=>{applyTheme(next);setPref(next)}} aria-label={`Switch to ${next} theme`}>{pref==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>;
}
export function Layout(){
 const [menu,setMenu]=useState(false); const loc=useLocation();
 const title=groups.flatMap(g=>g.items).find(i=>i.to===loc.pathname)?.label ?? (loc.pathname==='/planner'?'Planner':'Ariovelle');
 const close=()=>setMenu(false);
 const nav=(onNavigate?:()=>void)=><>{groups.map(g=><div className="ari-nav-group" key={g.title}><p className="ari-nav-heading">{g.title}</p>{g.items.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/'} onClick={onNavigate} className={({isActive})=>`ari-nav-link ${isActive?'is-active':''}`}><Icon size={17}/><span>{label}</span>{['/business','/ai','/markets','/planning'].includes(to)&&<i className="ari-nav-dot"/>}</NavLink>)}</div>)}</>;
 return <div className="ari-shell">
  <aside className="ari-sidebar" aria-label="Main navigation">
   <NavLink to="/" className="ari-brand"><span className="ari-brand-mark">A</span><span><span className="ari-brand-name">ariovelle</span><span className="ari-brand-caption">A PRODUCT OF LUCIA</span></span></NavLink>
   <button className="ari-workspace-switch" type="button"><span className="ari-workspace-avatar">P</span><span className="min-w-0 text-left"><b className="block text-xs">Personal workspace</b><small className="ari-muted">Individual account</small></span><ChevronDown size={15} className="ml-auto ari-muted"/></button>
   <nav className="ari-nav">{nav()}</nav>
   <div className="ari-sidebar-bottom"><div className="ari-plan-card"><span className="ari-plan-kicker">YOUR PLAN</span><strong>Free plan</strong><span className="ari-muted text-xs">Explore more with Ariovelle Pro.</span><NavLink to="/settings" className="ari-plan-link">Explore plans ↗</NavLink></div><NavLink to="/settings" className="ari-nav-link"><Settings2 size={17}/>Settings</NavLink><span className="ari-nav-link" aria-label="Help and support information"><CircleHelp size={17}/>Help & support</span><div className="ari-sidebar-footer">© {new Date().getFullYear()} Lucia LLC</div></div>
  </aside>
  {menu&&<div className="ari-mobile-overlay" onClick={close}><aside className="ari-mobile-drawer" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-5"><span className="ari-brand-name">ariovelle</span><button className="ari-icon-button" onClick={close} aria-label="Close menu"><X size={18}/></button></div>{nav(close)}<NavLink to="/settings" onClick={close} className="ari-nav-link"><Settings2 size={17}/>Settings</NavLink></aside></div>}
  <div className="ari-main-column">
   <header className="ari-topbar"><div className="flex items-center gap-3 min-w-0"><button className="ari-icon-button ari-mobile-menu-button" onClick={()=>setMenu(true)} aria-label="Open menu"><Menu size={19}/></button><div><p className="ari-topbar-eyebrow">LUCIA FINANCIAL PLATFORM</p><p className="ari-topbar-title">{title}</p></div></div><div className="flex items-center gap-2"><span className="ari-search-hint">⌕ <span>Search</span> <kbd>⌘ K</kbd></span><button className="ari-icon-button hidden sm:inline-grid" aria-label="Notifications"><Bell size={18}/></button><ThemeButton/><NavLink to="/settings" className="ari-profile-button" aria-label="Account settings">L</NavLink></div></header>
   <main className="ari-content"><Outlet/><footer className="ari-content-footer"><span>ARIOVELLE <b>·</b> A PRODUCT OF LUCIA</span><span>Financial intelligence. Without limits.</span></footer></main>
  </div>
  <nav className="ari-mobile-tabbar" aria-label="Mobile navigation">{mobile.map(({to,label,icon:Icon})=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`ari-mobile-tab ${isActive?'is-active':''}`}><Icon size={19}/><span>{label}</span></NavLink>)}<button className="ari-mobile-tab" onClick={()=>setMenu(true)}><MoreHorizontal size={19}/><span>More</span></button></nav>
 </div>;
}
