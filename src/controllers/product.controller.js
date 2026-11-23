import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createProductSchema, updateProductSchema } from '../validation/product.validation.js';
import * as ProductService from '../services/product.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { search, status, category, brand, unit, minPrice, maxPrice, sortBy, sortOrder, page, pageSize } = req.query;

  const result = await ProductService.getProducts({
    search,
    status,
    category,
    brand,
    unit,
    minPrice: minPrice !== undefined && minPrice !== '' ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : undefined,
    sortBy,
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    page: page ? Number(page) : 1,
    pageSize: pageSize ? Number(pageSize) : 20,
  });
  sendSuccess(res, result.products, undefined, 200, result.pagination);
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.trim().length < 1) {
    sendSuccess(res, []);
    return;
  }
  const products = await ProductService.searchProducts(q.trim());
  sendSuccess(res, products);
});

export const getLowStock = asyncHandler(async (_req, res) => {
  const products = await ProductService.getLowStockProducts();
  sendSuccess(res, products);
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await ProductService.getProductById(req.params.id);
  sendSuccess(res, product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  const product = await ProductService.createProduct(parsed.data, req.user.userId);
  sendSuccess(res, product, 'Product created successfully', 201);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  const product = await ProductService.updateProduct(req.params.id, parsed.data, req.user.userId);
  sendSuccess(res, product, 'Product updated successfully');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await ProductService.deleteProduct(req.params.id);
  sendSuccess(res, null, 'Product deleted successfully');
});
