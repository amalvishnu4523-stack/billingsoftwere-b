import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import * as UserService from '../services/user.service.js';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'sales'], { errorMap: () => ({ message: 'Role must be admin or sales' }) }),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'sales']).optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await UserService.getUsers();
  sendSuccess(res, users);
});

export const createUser = asyncHandler(async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  const user = await UserService.createUser(parsed.data);
  sendSuccess(res, user, 'User created successfully', 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  const user = await UserService.updateUser(req.params.id, parsed.data);
  sendSuccess(res, user, 'User updated successfully');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  await UserService.resetPassword(req.params.id, parsed.data.newPassword);
  sendSuccess(res, null, 'Password reset successfully');
});

export const deleteUser = asyncHandler(async (req, res) => {
  await UserService.deleteUser(req.params.id, req.user.userId);
  sendSuccess(res, null, 'User deleted successfully');
});
