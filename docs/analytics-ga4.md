# Trendora Tools GA4 analytics

Trendora Tools uses one dedicated GA4 web data stream. Configure the client-side Measurement ID with `VITE_GA_MEASUREMENT_ID`.

## Events

- `page_view`: one manual page view per actual React Router route transition.
- `tool_used`: `tool_name` is one of `expenses`, `income`, `budget`, `bills`, `savings`, `debts`, `reports`; `action` is a non-sensitive action such as `open`, `add`, `edit`, or `delete`.
- `planner_used`: planner open/use actions.
- `insights_viewed`: insights view state only; no underlying financial data.
- `app_launch`: `browser` or `installed_pwa`.
- `pwa_install`: platform (`android`, `ios`, or `desktop`) when the browser exposes the install event.
- `lucia_id_sign_in`, `lucia_id_sign_out`, `lucia_id_create_account`: outcome only.
- `cloud_backup`, `cloud_restore`: success/failure only.

## Privacy boundary

Analytics measures product usage, not the user's financial records. Never send account balances, expense amounts, income amounts, debt amounts, bank information, transaction descriptions, personal notes, financial account identifiers, Firebase UIDs, email addresses, names, passwords, or authentication tokens to GA4.

The analytics service allowlists event parameters, so unexpected parameters are dropped. Google signals and ad personalization signals are disabled.

Application data remains in the existing local/Firebase architecture. GA4 is not the application database, financial-record store, or authentication system.

## Testing

1. Set `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` in the deployment environment.
2. Run the existing test command: `npm run test`.
3. Run the production build: `npm run build`.
4. Navigate between product routes and use the major tools.
5. In GA4, open Reports > Realtime and verify events arrive.
6. Test with the Measurement ID removed. The app must still boot and all product functionality must remain usable.
7. Test with an ad blocker/offline connection. Analytics may fail silently; the app must not fail.

## Adding future events

Use `analytics.event(name, params)` and add the event's safe parameter names to the allowlist in `src/lib/analytics.ts`. Never pass application records to analytics. Add future purchase/subscription events only when real commerce actions exist.
