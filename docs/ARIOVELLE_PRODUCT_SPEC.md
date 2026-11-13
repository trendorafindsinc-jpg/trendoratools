# Ariovelle Product Requirements and UI Specification

**Status:** Approved product direction; implementation not yet verified.  
**Owner/operator:** Lucia LLC.  
**Product:** Ariovelle.  
**Brand line:** “A product of Lucia.”  
**Tagline:** “Financial Intelligence. Without Limits.”

## 1. Product vision

Ariovelle is a global financial intelligence ecosystem for individuals, small businesses and market participants. It combines personal finance management, business finance, AI-assisted financial understanding, global market research and financial planning.

The product must be useful to a beginner and capable of serving experienced users without presenting an unnecessarily complex interface. Financial records remain accessible to their owners regardless of subscription status.

### Core product divisions

1. **Overview:** personalized financial command centre.
2. **Personal Finance:** accounts, income, expenses, transactions, budgets, bills, recurring items, savings, debts, net worth and reports.
3. **Business Finance:** business workspaces, customers, suppliers, quotes, invoices, payments, expenses, cash flow, budgets, profit/loss, analytics, roles and team.
4. **AI Intelligence:** assistant and evidence-based explanations for personal and business finances, forecasts and scenarios.
5. **Global Markets:** forex, gold/silver, global indices and crypto; charts, indicators, market fundamentals, economic calendar, alerts, watchlists, trading journal and calculators.
6. **Financial Planning:** savings, debt repayment, emergency funds, retirement and scenario planning.
7. **Account & Integrations:** Lucia ID, profile, workspaces, permissions, notifications, subscriptions, billing, supported connections, import/export and privacy.

## 2. Brand and visual system

### Approved direction

- Premium, calm, confident and institutional—not casino-like, not crypto-hype.
- Midnight/navy foundation.
- Warm ivory and clean white surfaces.
- Restrained champagne-gold accent for brand emphasis and premium cues.
- Accessible text contrast; gold must not be used for small low-contrast body text.
- Clear financial typography with tabular numerals for amounts.
- Subtle borders, restrained shadows, generous spacing and clean data visualizations.
- Dark and light themes are both required; support saved preference and optionally system preference.

### Brand usage

- Product wordmark: Ariovelle.
- Parent signature: “A product of Lucia”.
- Lucia is the company; Lucia ID is the authentication service. Do not conflate them.
- TrendoraTools is legacy identity and should not appear in new user-facing product surfaces after the controlled rebrand.
- Do not invent a final logo asset or claim one is approved; logo design is a separate design deliverable.

### Responsive behavior

One responsive web application/PWA:

- **Desktop:** persistent or collapsible left navigation; top bar with search, notifications, workspace switcher and profile; multi-column dashboards and dense tables where useful.
- **Tablet:** collapsible drawer/rail; adaptive two-column layout; charts and tables remain touch-friendly.
- **Mobile:** compact header; five-item bottom navigation: Home, Finance, AI, Markets, More. Use single-column cards, compact chart controls, readable forms and accessible touch targets. Business, planning, integrations, reports and settings are accessible through relevant hubs/More.
- Never render a desktop sidebar squeezed into mobile. Avoid horizontal overflow. Preserve task continuity when changing breakpoints.

## 3. Screen inventory and acceptance intent

### 3.1 Public and identity screens

- Landing page: value proposition, product divisions, pricing, trust/security, CTA.
- Product/features page.
- Pricing page with Free, Personal Pro, Business and Markets Pro.
- Sign-in and sign-up entry through Lucia ID.
- Onboarding: personal/business intent, locale, base currency, timezone and preferences; collect only necessary data.
- Workspace selector/switcher.
- Legal/privacy/terms surfaces.

**Acceptance:** clear product/parent identity; responsive; no fake testimonials, unsupported compliance claims or fake pricing. Auth must use official Lucia ID integration once supplied. No Firebase-auth fallback in production.

### 3.2 Overview dashboard

- Greeting and active workspace context.
- Total balance/net worth only when backed by available, correctly scoped records.
- Income/expense/cash-flow summary and period selector.
- Budget progress and upcoming bills.
- Savings goal progress.
- Recent activity.
- Business snapshot when business workspace selected.
- Market watchlist preview when provider data is configured.
- AI insights with source, generation time and confidence/limitations.
- Quick actions: add transaction, create invoice, set budget, add goal, ask AI.

**Acceptance:** empty state for new accounts; all figures derived from records or clearly labelled sample data; currency visible; no invented totals.

### 3.3 Personal Finance screens

- Personal overview.
- Accounts and balances.
- Transactions (search, filters, pagination, create/edit, category, account, date, notes, source).
- Income and expenses.
- Categories.
- Budgets and budget detail.
- Bills and recurring transactions.
- Savings goals and contributions.
- Debt accounts and repayments.
- Net worth history.
- Reports and export.

**Acceptance:** users can create and inspect their own records on Free. Subscription expiry never deletes these records. Financial calculations use exact decimal/minor-unit arithmetic and explicit currency.

### 3.4 Business Finance screens

- Business overview/workspace.
- Business accounts.
- Customers and suppliers.
- Quotes/estimates.
- Invoices, invoice detail and payment status.
- Expenses and attachments (with secure storage policy).
- Cash flow.
- Profit and loss.
- Budgets.
- Reports/exports.
- Team members, roles and permissions.

**Acceptance:** basic business workspace and basic customer/invoice/expense workflows are available to Free within configurable limits. Advanced analytics, automation, team scale and advanced reporting are paid. Workspace ownership is enforced server-side.

### 3.5 AI Intelligence screens

- AI home and assistant.
- Personal spending analysis.
- Budget explanations/recommendations.
- Business performance explanations.
- Financial forecasting.
- Scenario simulator.
- Conversation history.
- Usage meter and plan details.

**Acceptance:** only authorized data is available to AI tools. Distinguish facts, calculations, estimates and generated suggestions. Show time window, assumptions and data sources. Do not fabricate missing data. Apply quotas server-side. Provide useful Free allowance; exact quota remains a product/economics configuration decision.

### 3.6 Global Markets screens

- Market overview.
- Forex, precious metals, indices, crypto category pages.
- Instrument detail and chart.
- Basic/advanced chart controls and indicators.
- Economic calendar.
- News/fundamentals with source and publication time.
- AI technical/fundamental analysis.
- Watchlists and alerts.
- Trading journal.
- Risk/reward, position-size, pip, margin and P&L calculators as applicable.

**Acceptance:** analysis/research only in initial release; no order execution. Only display instruments/data after provider coverage and licensing are verified. Every quote has source, timestamp, currency and delayed/real-time status. Forecasts show uncertainty, scenarios, assumptions and invalidation risk; no forecast when evidence is insufficient.

### 3.7 Financial Planning screens

- Planning home.
- Savings target calculator.
- Emergency-fund planner.
- Debt repayment planner.
- Retirement/long-term goals.
- Scenario modelling.
- Progress and reports.

**Acceptance:** calculators expose assumptions and calculation logic; outputs are estimates, not guarantees.

### 3.8 Account and settings screens

- Profile and preferences.
- Lucia ID connection/status.
- Security and sessions (as supported by official identity integration).
- Workspaces and team.
- Integrations.
- Import/export.
- Notifications.
- Subscription and invoices/receipts.
- Privacy, consent and data controls.
- Help/support.

**Acceptance:** never imply an integration is active before connection is verified. Basic export and account-data access remain available on Free.

## 4. Navigation map

### Desktop primary navigation

- Overview
- Personal Finance
  - Accounts
  - Transactions
  - Budgets
  - Bills & recurring
  - Savings
  - Debts
  - Reports
- Business Finance
  - Overview
  - Customers & suppliers
  - Invoices & quotes
  - Expenses
  - Cash flow
  - Reports
  - Team
- AI Intelligence
- Global Markets
  - Overview
  - Forex
  - Metals
  - Indices
  - Crypto
  - Watchlists
  - Alerts
  - Journal
  - Calculators
- Financial Planning
- Settings / Integrations / Subscription

### Mobile bottom navigation

Home · Finance · AI · Markets · More. Contextual sub-navigation remains within each area.

## 5. Freemium model and entitlements

### Plans

- **Ariovelle Free:** permanent useful free tier.
- **Personal Pro:** advanced personal finance, planning, automation and expanded AI.
- **Business:** advanced business reporting, workflow, team and business intelligence.
- **Markets Pro:** advanced charting, indicators, market research and premium market AI.

Prices, billing intervals, trial policy and exact quotas are **not yet approved**. Do not invent or hardcode them.

### Entitlement principles

- Free is useful, not merely a trial or teaser.
- Users always retain access to their own stored financial records and basic export.
- Expired paid features may become unavailable or read-only, but never cause deletion of records.
- Lucia ID authentication is not a paid feature.
- Feature checks must be centralized and server-enforced.
- Market data is constrained by vendor licensing and cost; free access may be delayed/limited only where the provider contract allows it.
- All quotas and limits are configurable, not scattered hardcoded UI constants.

### Feature matrix

| Feature | Free | Personal Pro | Business | Markets Pro |
|---|---|---|---|---|
| Personal accounts, transactions, income/expenses | Yes | Yes | Yes | Yes |
| Basic budgets, bills, recurring items | Yes/basic | Advanced | Basic | Basic |
| Savings goals and debt tracking | Yes/basic | Advanced | Basic | Basic |
| Basic net worth and reports | Yes/basic | Advanced | Basic | Basic |
| Personal forecasts/scenarios | — | Yes | — | — |
| Basic business workspace | Yes/limited | Yes/limited | Yes | Yes/limited |
| Basic customers, quotes, invoices, expenses | Yes/limited | Yes/limited | Advanced | Yes/limited |
| Advanced cash-flow, P&L, business analytics | —/basic summary | — | Yes | — |
| Expanded team roles and automation | — | — | Yes | — |
| Basic AI questions and summaries | Limited | Expanded | Expanded | Expanded |
| Advanced AI forecasts and scenario analysis | — | Yes | Yes | Yes |
| Basic market overview and basic charts | Yes, licensed coverage | Yes | Yes | Yes |
| Advanced indicators/charting/history | — | — | — | Yes |
| Advanced technical/fundamental AI analysis | — | — | — | Yes |
| Advanced watchlists/alerts/journal analytics | Limited | Limited | Limited | Yes |
| Basic calculators and export | Yes | Yes | Yes | Yes |
| Priority support | — | Yes | Yes | Yes |

“Basic” and “limited” need explicit configurable limits before launch. The matrix is a product policy baseline, not a finished quota schedule.

### Upgrade UX

When a user reaches a premium feature:
1. Explain the capability and its value.
2. State what is available on the current plan.
3. Show the relevant upgrade plan and its benefits.
4. Offer a clear upgrade action.
5. Allow dismissal and return to existing work.
6. Never use deceptive urgency or block access to existing user records.

## 6. Data and domain model (conceptual)

Initial domains/entities to design; normalize and refine during schema design:

- Identity: users, external_identities, profiles.
- Workspaces: workspaces, workspace_members, roles, invitations.
- Personal: financial_accounts, transactions, categories, budgets, recurring_transactions, bills, savings_goals, debts, debt_payments.
- Business: businesses, customers, suppliers, invoices, invoice_lines, quotes, payments, business_expenses, cash_flow_snapshots.
- AI: conversations, messages, insight_runs, insight_sources, model_usage.
- Markets: instruments, data_providers, quotes, candles, watchlists, watchlist_items, alerts, economic_events, market_news_sources, forecasts, forecast_evaluations, trading_journal_entries.
- Billing: plans, feature_definitions, plan_entitlements, subscriptions, subscription_events, payment_transactions, usage_counters.
- Governance: audit_events, notifications, import_jobs, export_jobs, consent_records.

Use UUID/ULID internal IDs as appropriate. All tenant-owned rows include an ownership/workspace boundary. Add indexes and constraints based on query patterns. Avoid a single polymorphic table where referential integrity is important.

## 7. Non-functional requirements

- Responsive, accessible, keyboard-operable UI.
- Secure by default, least privilege, strict tenant isolation.
- Financially correct exact arithmetic and explicit currencies.
- UTC instants and explicit timezone/date semantics.
- Auditability and reversible data operations.
- Clear loading, empty, offline, error and permission states.
- Performance appropriate for low-end mobile devices and constrained networks.
- PWA support where it does not compromise data safety.
- Observability without logging secrets or sensitive financial payloads.
- Backup/restore and migration rollback before production cutover.
- Automated unit, integration and end-to-end coverage for critical financial and access flows.

## 8. Out of scope until separately approved

- Brokerage/order execution or custody.
- Deposits, withdrawals, money movement or payment initiation.
- Personalized investment advice or guaranteed returns.
- Market data redistribution without explicit licensing.
- Unverified bank aggregation/open-banking connections.
- Automatic AI actions that mutate financial records without user confirmation.
- Final pricing, quotas, SLAs or compliance certifications before validation.
