import type { WisecraftQuery, WisecraftResponse } from './types';

/**
 * WISECRAFT integration boundary.
 * Frontend stays deterministic. Remote intelligence is optional and never hardcodes secrets.
 * Set VITE_WISECRAFT_ENDPOINT in env to enable a future backend.
 */
const ENDPOINT = (import.meta as ImportMeta & { env: Record<string, string> }).env?.VITE_WISECRAFT_ENDPOINT || '';

export async function queryWisecraft(query: WisecraftQuery): Promise<WisecraftResponse> {
  if (!ENDPOINT) {
    return {
      reply:
        'WISECRAFT remote is offline. TrendoraTools is running in local deterministic mode — exact math only, no AI claims.',
      confidence: 1,
      source: 'local-deterministic'
    };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    if (!res.ok) throw new Error(`WISECRAFT HTTP ${res.status}`);
    const data = (await res.json()) as WisecraftResponse;
    return { ...data, source: data.source || 'wisecraft-remote' };
  } catch {
    return {
      reply: 'WISECRAFT is unreachable. Falling back to local deterministic tools.',
      confidence: 0.4,
      source: 'local-deterministic'
    };
  }
}

export function isWisecraftConfigured(): boolean {
  return Boolean(ENDPOINT);
}
