import React, { useRef, useState } from 'react';
import { useAppStore } from '../store';
import { Card } from '../components/Card';
import { Download, Upload } from 'lucide-react';

export default function Settings() {
  const { exportData, importData } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportData());
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'trendoratools_backup.json');
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Data backup and restore. Everything stays on your device.</p>
      </div>

      {msg && (
        <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm">{msg}</div>
      )}

      <Card title="Data management">
        <p className="text-sm text-slate-400 mb-6">
          Export your data to back it up, or import a previously exported JSON file.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleExport} className="btn-secondary flex-1">
            <Download size={18} /> Export Data
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1">
            <Upload size={18} /> Import Data
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </Card>

      <Card title="About">
        <p className="text-sm text-slate-400">
          TrendoraTools v0.4.0 under the LUCIA brand by Trendora Inc. Deterministic tools only —
          no AI claims. All financial values use integer minor units. Data is stored locally in
          your browser.
        </p>
      </Card>
    </div>
  );
}
