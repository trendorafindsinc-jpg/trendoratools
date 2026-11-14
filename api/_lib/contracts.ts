import { z } from 'zod';

const requestIdSchema = z.string().uuid();

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    requestId: requestIdSchema,
  }).strict(),
}).strict();

export const liveHealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('ariovelle-api'),
  probe: z.literal('live'),
  requestId: requestIdSchema,
}).strict();

const dependencyStatusSchema = z.object({
  configuration: z.enum(['configured', 'not_configured']),
  connectivity: z.literal('not_checked'),
}).strict();

export const readyHealthResponseSchema = z.object({
  status: z.literal('ready'),
  service: z.literal('ariovelle-api'),
  scope: z.literal('api-scaffold'),
  capabilities: z.array(z.string()),
  dependencies: z.object({
    database: dependencyStatusSchema,
    identityProvider: dependencyStatusSchema,
  }).strict(),
  requestId: requestIdSchema,
}).strict();

/** Future authenticated DTOs. These schemas do not create or expose routes. */
export const meResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email().nullable(),
    displayName: z.string().max(160).nullable(),
    createdAt: z.string().datetime({ offset: true }),
  }).strict(),
}).strict();

export const workspaceDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  type: z.enum(['personal', 'business']),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
}).strict();

export const workspaceListResponseSchema = z.object({
  workspaces: z.array(workspaceDtoSchema),
}).strict();

export type LiveHealthResponse = z.infer<typeof liveHealthResponseSchema>;
export type ReadyHealthResponse = z.infer<typeof readyHealthResponseSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type WorkspaceDto = z.infer<typeof workspaceDtoSchema>;
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;
