import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { Download, Upload, Scale, FileText, Shield, Cookie, Ban, Code2 } from 'lucide-react';

const legalLinks = [
  { to: '/legal/terms', label: 'Terms of Service', icon: FileText },
  { to: '/legal/privacy', label: 'Privacy Policy', icon: Shield },
  { to: '/legal/disclaimer', label: 'Financial Disclaimer', icon: Scale },
  { to: '/legal/cookies', label: 'Cookie Policy', icon: Cookie },
  { to: '/legal/acceptable-use', label: 'Acceptable Use', icon: Ban },
  { to: '/legal/licenses', label: 'Open Source Licenses', icon: Code2 }
];

export default function Settings() {
  const { exportData, importData } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportData());
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'trendora-tools-backup.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMsg('Data exported successfully.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importData(event.target?.result as string);
        setMsg('Imported successfully. Refreshing…');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err: unknown) {
        setMsg(err instanceof Error ? err.message : 'Import failed');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient-brand">Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Data backup, product info, and legal documents.</p>
      </div>

      {msg && (
        <div className="p-3 bg-indigo-500/10 text-indigo-200 border border-indigo-500/20 rounded-xl text-sm">
          {msg}
        </div>
      )}

      <Card title="Data management">
        <p className="text-sm text-slate-400 mb-6">Your data is stored locally. Export to back up, or import to restore.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={handleExport} className="btn-secondary flex-1"><Download size={18} /> Export Data</button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1"><Upload size={18} /> Import Data</button>
          <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImport} />
        </div>
      </Card>

      <Card title="Legal">
        <ul className="divide-y divide-white/5">
          {legalLinks.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className="flex items-center gap-3 py-3 text-sm text-slate-300 hover:text-white transition">
                <Icon size={16} className="text-slate-500" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="About">
        <p className="text-sm text-slate-400 leading-relaxed">
          Trendora Tools under Trendora, a LUCIA company. The product is local-first and focused on practical financial tracking, planning, and deterministic insights — with no AI chatbot or remote AI integration.
        </p>
      </Card>
    </div>
  );
}
