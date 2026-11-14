export type AriovelleSession = {
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    createdAt: string;
  };
  workspace: {
    id: string;
    name: string;
    type: 'personal' | 'business';
    role: 'owner' | 'admin' | 'member' | 'viewer';
  };
};

async function parseError(response: Response): Promise<{ code?: string; message: string }> {
  try {
    const body = await response.json() as { error?: { code?: string; message?: string } };
    return { code: body.error?.code, message: body.error?.message || 'The request could not be completed.' };
  } catch {
    return { message: 'The request could not be completed.' };
  }
}

export async function getCurrentAriovelleSession(signal?: AbortSignal): Promise<AriovelleSession | null> {
  let response: Response;
  try {
    response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('Ariovelle could not reach the session service. Check your connection and retry.');
  }

  if (response.status === 401) {
    const error = await parseError(response);
    if (error.code === 'AUTH_DISABLED') throw new Error(error.message);
    return null;
  }
  if (!response.ok) throw new Error((await parseError(response)).message);

  const payload = await response.json() as AriovelleSession;
  if (
    !payload?.user?.id ||
    !payload?.workspace?.id ||
    !payload.user.createdAt ||
    !['personal', 'business'].includes(payload.workspace.type) ||
    !['owner', 'admin', 'member', 'viewer'].includes(payload.workspace.role)
  ) {
    throw new Error('Ariovelle received an invalid session response.');
  }
  return payload;
}

export async function signOutAriovelle(): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new Error('Ariovelle could not reach the sign-out service. Please retry.');
  }
  if (!response.ok) throw new Error((await parseError(response)).message);
}

export function startLuciaSignIn(): void {
  window.location.assign('/api/auth/lucia/start');
}
