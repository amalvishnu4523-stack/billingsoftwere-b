import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createSaleSchema } from '../validation/sale.validation.js';
import * as SaleService from '../services/sale.service.js';

export const createSale = asyncHandler(async (req, res) => {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  const sale = await SaleService.createSale(parsed.data, req.user.userId);
  sendSuccess(res, sale, 'Bill created successfully', 201);
});

export const listSales = asyncHandler(async (req, res) => {
  const { search, startDate, endDate, page, pageSize } = req.query;
  const result = await SaleService.getSales({
    search,
    startDate,
    endDate,
    page: page ? Number(page) : 1,
    pageSize: pageSize ? Number(pageSize) : 20,
  });
  sendSuccess(res, result.sales, undefined, 200, result.pagination);
});

export const getSale = asyncHandler(async (req, res) => {
  const sale = await SaleService.getSaleById(req.params.id);
  sendSuccess(res, sale);
});

export const cancelSale = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    return;
  }
  const sale = await SaleService.cancelSale(req.params.id, req.user.userId, reason.trim());
  sendSuccess(res, sale, 'Bill cancelled and stock restored');
});

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const stats = await SaleService.getDashboardStats();
  const recent = await SaleService.getRecentSales(5);
  sendSuccess(res, { stats, recentSales: recent });
});
