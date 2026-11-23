import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as ReportService from '../services/report.service.js';

const router = Router();
router.use(verifyToken);

router.get('/summary', asyncHandler(async (req, res) => {
  const { period = 'this_month', startDate, endDate } = req.query;
  const data = await ReportService.getSummaryReport(period, startDate, endDate);
  sendSuccess(res, data);
}));

router.get('/trend', asyncHandler(async (req, res) => {
  const { period = 'this_month', startDate, endDate } = req.query;
  const data = await ReportService.getSalesTrend(period, startDate, endDate);
  sendSuccess(res, data);
}));

router.get('/top-products', asyncHandler(async (req, res) => {
  const { period = 'this_month', startDate, endDate, limit } = req.query;
  const data = await ReportService.getTopProducts(period, startDate, endDate, Number(limit) || 10);
  sendSuccess(res, data);
}));

router.get('/payment-breakdown', asyncHandler(async (req, res) => {
  const { period = 'this_month', startDate, endDate } = req.query;
  const data = await ReportService.getPaymentBreakdown(period, startDate, endDate);
  sendSuccess(res, data);
}));

router.get('/stock-valuation', asyncHandler(async (_req, res) => {
  const data = await ReportService.getStockValuation();
  sendSuccess(res, data);
}));

export default router;
