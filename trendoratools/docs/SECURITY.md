# Security Notes

- No secrets are stored in the repository.

- Environment variables are optional and documented in `.env.example`.
- The app does not authenticate users in this local-first release.
- Local data stays in the browser through the storage adapter.
- Import validates JSON shape before replacing app state.
- Destructive actions require confirmation.
- Future backend integration should add authentication, authorization, encrypted transport, and
server-side validation.
