import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '7 September 2026';
const COMPANY = 'LUCIA';
const PRODUCT = 'Trendora Tools';
const BRAND = 'Trendora';

const content: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms of Service',
    body: `These Terms of Service (“Terms”) govern access to and use of ${PRODUCT}, a software product operated under the ${BRAND} brand by ${COMPANY} (“we”, “us”, or “our”). By accessing or using ${PRODUCT}, you agree to be bound by these Terms. If you do not agree, do not use the product.

1. Description of the service
${PRODUCT} provides personal productivity and financial-tracking tools, including but not limited to expense and income logging, budgets, bills, savings goals, debts, reports, insights, and an action-oriented planner. The product is designed to operate primarily on your device using local storage. Optional cloud backup (“Lucia Cloud”) may be available when you authenticate with a LUCIA ID, subject to the Privacy Policy.

2. Eligibility
You must be able to form a binding contract under the laws of your jurisdiction. If you use ${PRODUCT} on behalf of an organization, you represent that you have authority to bind that organization to these Terms.

3. Accounts and guest access
You may use ${PRODUCT} as a guest (local-only) or with a LUCIA ID. You are responsible for maintaining the confidentiality of your credentials and for activity under your account. Notify us promptly of any unauthorized use of your LUCIA ID in connection with this product.

4. Your data and responsibility
You retain ownership of the financial and personal data you enter. You are solely responsible for the accuracy, legality, and completeness of that data. ${PRODUCT} performs deterministic calculations based on the data you provide; errors in input will produce corresponding errors in output.

5. Not professional advice
${PRODUCT} is a software tool for organization and education. It is not a bank, broker, insurer, tax advisor, legal advisor, or licensed financial advisor. Nothing in the product constitutes investment, tax, legal, or other professional advice. Always consult qualified professionals before making material financial decisions.

6. Acceptable use
You agree to use ${PRODUCT} only for lawful purposes consistent with the Acceptable Use Policy. You must not attempt to disrupt the service, circumvent security, reverse engineer in violation of applicable law, or use the product to facilitate fraud or other illegal activity.

7. Intellectual property
${PRODUCT}, the ${BRAND} and ${COMPANY} names, logos, and related marks are owned by ${COMPANY} or its licensors. You receive a limited, non-exclusive, non-transferable, revocable license to use the product for personal (or internal organizational) use in accordance with these Terms. Open-source components are licensed under their respective licenses (see Open Source Licenses).

8. Third-party services
Optional features may rely on third-party infrastructure (for example, authentication or cloud storage providers configured via environment variables at deployment). Those services are subject to their own terms. We do not control third-party networks or devices.

9. Availability and changes
We may modify, suspend, or discontinue features with or without notice. We do not guarantee uninterrupted or error-free operation. Continued use after changes to these Terms constitutes acceptance of the revised Terms when we post an updated effective date.

10. Disclaimers
TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${PRODUCT} IS PROVIDED “AS IS” AND “AS AVAILABLE”, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

11. Limitation of liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${COMPANY} AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF ${PRODUCT}. OUR AGGREGATE LIABILITY FOR CLAIMS RELATING TO THE PRODUCT SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE PRODUCT IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED US DOLLARS (OR LOCAL EQUIVALENT), EXCEPT WHERE LIABILITY CANNOT BE LIMITED UNDER APPLICABLE LAW.

12. Indemnity
You agree to indemnify and hold harmless ${COMPANY} from claims arising out of your misuse of the product, your data, or your violation of these Terms or applicable law.

13. Termination
You may stop using ${PRODUCT} at any time and may clear local data via browser controls or product export/delete flows. We may suspend or terminate access for breach of these Terms or for risk to the service or other users.

14. Governing law
These Terms are governed by the laws applicable to ${COMPANY}’s principal place of business, without regard to conflict-of-law rules, except where mandatory consumer protections in your country require otherwise.

15. Contact
For questions about these Terms, contact ${COMPANY} through the official channels published for the ${BRAND} / LUCIA product family.

Effective date: ${LAST_UPDATED}.`
  },
  privacy: {
    title: 'Privacy Policy',
    body: `This Privacy Policy explains how ${COMPANY} (“we”, “us”) handles information in connection with ${PRODUCT}, a ${BRAND} product. We designed ${PRODUCT} to be local-first: your financial records stay on your device unless you choose optional cloud features.

1. Who we are
${PRODUCT} is offered under the ${BRAND} brand by ${COMPANY}. This policy applies to the web and installable (PWA / native shell) experiences of ${PRODUCT}.

2. Information we process

2.1 Local financial records (default)
By default, expenses, income, budgets, bills, savings goals, debts, categories, and similar records are stored in your browser’s local storage (or equivalent on-device storage in a native shell). This data does not leave your device unless you export it, enable cloud backup, or your device/browser syncs storage through mechanisms outside our control.

2.2 Account information (when you sign in)
If you sign in with a LUCIA ID (email/password or supported identity providers such as Google, where enabled), we process identifiers needed for authentication (for example email address, display name, user ID, and verification status). Authentication is provided through infrastructure configured at deployment time (for example Firebase Authentication). API keys and project identifiers are supplied via environment variables and are not hard-coded in the public application source repository.

2.3 Optional Lucia Cloud backup
If you use Lucia Cloud backup or sync while signed in, copies of your Trendora Tools records may be stored in cloud databases associated with your authenticated user ID so you can restore them on another device. Access is scoped to your account.

2.4 Technical and preference data
We may store on-device preferences such as theme (light/dark), welcome/onboarding flags, and guest-mode flags. Hosting platforms and CDNs may automatically process standard technical logs (IP address, user agent, timestamps) as part of delivering the website; such processing is governed by those providers’ policies and our configuration of them.

2.5 What we do not do by default
We do not sell your personal financial records. We do not use your ledger data for third-party advertising. ${PRODUCT} does not include a third-party AI chatbot that transmits your financial history for model training as part of core tracking features.

3. Purposes of processing
We process information to: (a) provide and secure the product; (b) authenticate LUCIA ID users; (c) perform optional cloud backup/restore at your request; (d) remember preferences; (e) maintain, debug, and improve reliability; and (f) comply with law.

4. Legal bases (where applicable)
Depending on your jurisdiction, processing may rely on: performance of a contract (providing the service you request); consent (for optional cloud features or certain cookies where required); legitimate interests (security, fraud prevention, product improvement that does not override your rights); and legal obligation.

5. Sharing
We share data only as needed with: infrastructure providers that host authentication, storage, or the website under our instruction; professional advisors under confidentiality; and authorities when required by law. We do not sell personal data.

6. International transfers
Cloud providers may process data in multiple regions. Where required, we rely on appropriate transfer mechanisms offered by those providers or applicable law.

7. Retention
Local data remains until you clear site data, uninstall the app, or overwrite it via import. Cloud backups, when enabled, are retained until you delete them or close your account according to LUCIA account procedures, subject to legal retention requirements and backup systems.

8. Security
We implement reasonable technical and organizational measures appropriate to the nature of the service. No method of transmission or storage is completely secure. You are responsible for device security and for exporting backups before clearing storage.

9. Your rights
Depending on your location, you may have rights to access, correct, delete, port, or restrict processing of personal data, and to object or withdraw consent. For local-only data, you can export or delete via the product and browser controls. For LUCIA ID and cloud data, use in-product controls where available and contact ${COMPANY} through official LUCIA channels.

10. Children
${PRODUCT} is not directed at children under 16 (or the minimum age required in your country). We do not knowingly collect personal data from children below that age.

11. Changes
We may update this Privacy Policy from time to time. The “Last updated” date at the bottom of the in-app legal page will change when we do. Material changes will be highlighted in-product or on our official channels when appropriate.

12. Contact
Privacy inquiries regarding ${PRODUCT} may be directed to ${COMPANY} via official ${BRAND} / LUCIA contact channels published for the product family.

Last updated: ${LAST_UPDATED}.`
  },
  disclaimer: {
    title: 'Financial Disclaimer',
    body: `IMPORTANT — PLEASE READ

${PRODUCT}, offered under the ${BRAND} brand by ${COMPANY}, provides software tools for personal organization, record-keeping, budgeting, and planning. It is not a substitute for professional advice.

1. No advisory relationship
Use of ${PRODUCT} does not create a client, advisory, fiduciary, or professional relationship between you and ${COMPANY}, its officers, employees, or partners. Nothing in the product should be interpreted as a recommendation to buy, sell, or hold any security, currency, product, or service.

2. Educational and organizational purpose only
Features such as Insights, Planner, reports, budgets, debt ordering, and savings progress are based solely on data you enter and deterministic calculations. They are intended to help you organize information—not to guarantee outcomes, optimize taxes, or replace a licensed advisor, accountant, or attorney.

3. Accuracy of calculations
Amounts are stored and computed using integer minor units (for example kobo or cents) to reduce floating-point error. Currency formatting uses standard locale facilities. Despite this design, you remain responsible for verifying any figure before relying on it for real-world decisions, filings, or payments.

4. Market and personal circumstances
Past patterns in your data do not predict future results. Interest rates, fees, exchange rates, inflation, employment, and personal circumstances change. ${COMPANY} is not responsible for losses arising from decisions you make using the product.

5. Third-party information
If you compare product outputs with bank statements, invoices, or other external sources, those sources control in case of discrepancy.

6. Jurisdiction-specific rules
Consumer, financial, and data-protection laws vary. You are responsible for compliance with laws that apply to you.

7. Limitation
To the fullest extent permitted by law, ${COMPANY} disclaims liability for financial decisions made in reliance on ${PRODUCT}. See also the Terms of Service.

Last updated: ${LAST_UPDATED}.`
  },
  cookies: {
    title: 'Cookie & Local Storage Policy',
    body: `This policy describes how ${PRODUCT} (${BRAND} / ${COMPANY}) uses cookies, local storage, and similar technologies.

1. Essential local storage
${PRODUCT} uses browser local storage (and similar on-device storage in native shells) to keep your financial records, preferences (including light/dark theme), and session-related flags (such as welcome completion and guest mode). These technologies are necessary for the core offline-capable experience.

2. Authentication
When you sign in with a LUCIA ID, authentication providers may set cookies or tokens required to maintain a secure session. Those technologies are essential to signed-in features and optional Lucia Cloud backup.

3. Analytics and advertising cookies
${PRODUCT}’s core experience is not built around third-party advertising cookies. If a specific deployment enables optional analytics, that deployment should disclose it; default product design does not require marketing trackers to use local tools.

4. Managing storage
You can clear site data through your browser or device settings. Doing so may delete local financial records. Export a backup from Settings before clearing data if you wish to keep a copy. Uninstalling a PWA or native shell may also remove on-device data depending on the platform.

5. Do Not Track
There is no uniform industry standard for DNT signals. We focus on minimizing unnecessary third-party tracking in the default product configuration.

6. Updates
We may update this policy when our use of storage technologies changes. See the date below.

Last updated: ${LAST_UPDATED}.`
  },
  'acceptable-use': {
    title: 'Acceptable Use Policy',
    body: `This Acceptable Use Policy (“AUP”) applies to ${PRODUCT} under the ${BRAND} brand operated by ${COMPANY}.

You agree not to:

1. Use the product for any unlawful purpose, including fraud, money laundering, or evasion of legal obligations.
2. Upload or enter data you are not authorized to process.
3. Attempt to gain unauthorized access to accounts, systems, or data belonging to others.
4. Interfere with or disrupt the integrity or performance of the service or underlying infrastructure.
5. Probe, scan, or test vulnerabilities except with prior written authorization from ${COMPANY}.
6. Reverse engineer, decompile, or disassemble the product except to the extent mandatory law allows.
7. Misrepresent your identity or affiliation when using LUCIA ID features.
8. Use automated means to access the service in a manner that imposes unreasonable load, except ordinary browser or accessibility tools.
9. Redistribute the product as your own commercial offering without authorization.
10. Use the product to develop or train competing models or services by systematically extracting non-public product behavior in violation of these terms or applicable law.

${COMPANY} may investigate violations and suspend or terminate access. Reserved rights and remedies under the Terms of Service and law apply.

Last updated: ${LAST_UPDATED}.`
  },
  licenses: {
    title: 'Open Source Licenses',
    body: `${PRODUCT} is proprietary software of ${COMPANY} under the ${BRAND} brand, and incorporates open-source components. We gratefully acknowledge the following (non-exhaustive) projects and their licenses as distributed with typical builds of this product:

• React — MIT License
• React DOM — MIT License
• React Router — MIT License
• Zustand — MIT License
• date-fns — MIT License
• Lucide Icons — ISC License
• Vite — MIT License
• Tailwind CSS — MIT License
• TypeScript — Apache License 2.0
• Firebase JavaScript SDK (when enabled) — Apache License 2.0
• Capacitor (when used for native shells) — MIT License

Full license texts are available in the dependency packages and at the upstream project repositories. Nothing in this notice grants rights to ${COMPANY} trademarks or the ${PRODUCT} source beyond applicable open-source licenses for third-party components.

Last updated: ${LAST_UPDATED}.`
  }
};

export default function Legal() {
  const { page } = useParams();
  const data = content[page || 'terms'] || content.terms;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-8 scroll-pad-nav lg:pb-0">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition"
      >
        <ArrowLeft size={16} /> Back to Settings
      </Link>
      <div className="glass-panel p-8 md:p-12 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-violet-400 mb-2">{COMPANY} · {BRAND}</p>
          <h1 className="text-3xl font-bold text-gradient-brand">{data.title}</h1>
        </div>
        <div className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line text-sm sm:text-base">
          {data.body}
        </div>
        <p className="text-xs text-[var(--text-faint)] pt-8 border-t border-[var(--divider)]">
          {PRODUCT} is a product of {BRAND}, under {COMPANY}. Last updated: {LAST_UPDATED}.
        </p>
      </div>
    </div>
  );
}
