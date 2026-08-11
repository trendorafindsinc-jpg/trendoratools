# TrendoraTools Architecture

## Layered architecture

```text
UI Views
  ↓
UI State / Router
  ↓
Application Store
  ↓
Domain Logic
  ↓
Repository / Storage Adapter
```

## Intent and tool routing

TrendoraTools uses a deterministic local intent parser. It is not an AI system.

```text
User input
  ↓
LocalIntentProvider
  ↓
ToolIntent
  ↓
Route / Prefill / Direct Action
  ↓
Productivity Tool
```

Future WISECRAFT integration can replace or augment the intent provider without changing the tools or data layer.

## Tool registry

Tools register as modules with metadata. This allows future LUCIA tools to be added without restructuring the app.

## Persistence

The current implementation uses `localStorage` through a storage adapter abstraction. A future backend can replace the adapter with an API repository.

## Financial correctness

Money is stored as integer minor units. For NGN, ₦1.00 = 100 minor units. This avoids floating point arithmetic for totals and percentages.
