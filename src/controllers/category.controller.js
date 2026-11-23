import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import * as CategoryService from '../services/category.service.js';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await CategoryService.getCategories();
  sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  const category = await CategoryService.createCategory(parsed.data.name, parsed.data.description);
  sendSuccess(res, category, 'Category created', 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  const category = await CategoryService.updateCategory(req.params.id, parsed.data.name, parsed.data.description);
  sendSuccess(res, category, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await CategoryService.deleteCategory(req.params.id);
  sendSuccess(res, null, 'Category deleted');
});
