import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const content: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms of Service',
    body: `By using Trendora Tools, you agree to these terms. Trendora Tools provides organizational and financial-tracking tools. It is not a substitute for professional financial, legal, tax, or investment advice. LUCIA makes no guarantees regarding financial results.\n\nYou are responsible for the accuracy of data you enter. Features may change as the product evolves. Continued use after updates constitutes acceptance of revised terms.`
  },
  privacy: {
    title: 'Privacy Policy',
    body: `Trendora Tools is private by design. All financial data is stored locally on your device using browser storage. We do not collect, transmit, or sell your personal financial information to external servers by default.\n\nTrendora Tools does not include an AI chatbot or a WISECRAFT remote integration. Your financial records remain within the local tools unless a future feature explicitly states otherwise.`
  },
  disclaimer: {
    title: 'Financial Disclaimer',
    body: `The tools provided by Trendora Tools are for educational and organizational purposes only. Always consult with a qualified financial advisor before making significant financial decisions.\n\nCurrency formatting and minor-unit math are designed for accuracy, but you remain responsible for verifying figures that matter to your situation.`
  },
  cookies: {
    title: 'Cookie Policy',
    body: `Trendora Tools uses local browser storage to maintain your session, preferences, and financial records. We do not use third-party tracking cookies.\n\nClearing site data in your browser will remove stored records. Export a backup from Settings before clearing if you need to keep your history.`
  },
  'acceptable-use': {
    title: 'Acceptable Use',
    body: `You agree to use Trendora Tools only for lawful personal productivity and financial tracking purposes. Do not attempt to abuse, reverse-engineer for harm, or use the product to facilitate illegal activity.`
  },
  licenses: {
    title: 'Open Source Licenses',
    body: `Trendora Tools is built with respect for the open-source community. React, Tailwind CSS, Zustand, date-fns, Vite, and Lucide Icons are used under their respective licenses.\n\nTrendora Tools is a product of Trendora, under LUCIA.`
  }
};

export default function Legal() {
  const { page } = useParams();
  const data = content[page || 'terms'] || content.terms;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-8">
      <Link to="/settings" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition">
        <ArrowLeft size={16} /> Back to Settings
      </Link>
      <div className="glass-panel p-8 md:p-12 space-y-6">
        <h1 className="text-3xl font-bold text-gradient-brand">{data.title}</h1>
        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{data.body}</p>
        <p className="text-xs text-slate-500 pt-8 border-t border-white/5">
          Trendora Tools is a product of Trendora, under LUCIA. Last updated: 2026.
        </p>
      </div>
    </div>
  );
}
