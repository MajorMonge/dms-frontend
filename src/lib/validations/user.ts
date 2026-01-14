import { z } from 'zod';

// NOTE: Keep in sync with backend-ex/src/schemas/user.schema.ts

// ============= Shared Base Schemas =============

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const userIdSchema = z.string().regex(objectIdRegex, 'Invalid ID format');

// ============= User Schemas (matching backend) =============

/**
 * Schema for updating user metadata (self)
 */
export const updateUserBodySchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

/**
 * Schema for admin user updates
 */
export const adminUpdateUserBodySchema = updateUserBodySchema.extend({
  storageLimit: z.number().min(0).optional(),
});

export type AdminUpdateUserBody = z.infer<typeof adminUpdateUserBodySchema>;

/**
 * Schema for user ID in params
 */
export const userIdParamsSchema = z.object({
  id: userIdSchema,
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;

/**
 * Schema for listing users query params (admin)
 */
export const listUsersQuerySchema = z.object({
  search: z.string().max(100).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  sortBy: z
    .enum(['email', 'createdAt', 'storageUsed'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
