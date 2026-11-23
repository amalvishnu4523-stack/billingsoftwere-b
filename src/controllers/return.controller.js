import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createReturnSchema, updateReturnStatusSchema } from '../validation/return.validation.js';
import * as ReturnService from '../services/return.service.js';

export const createReturn = asyncHandler(async (req, res) => {
  const parsed = createReturnSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  const ret = await ReturnService.createReturn(parsed.data, req.user.userId);
  sendSuccess(res, ret, 'Return processed successfully', 201);
});

export const listReturns = asyncHandler(async (req, res) => {
  const { search, status, startDate, endDate, page, pageSize } = req.query;
  const result = await ReturnService.getReturns({
    search,
    status,
    startDate,
    endDate,
    page: page ? Number(page) : 1,
    pageSize: pageSize ? Number(pageSize) : 20,
  });
  sendSuccess(res, result.returns, undefined, 200, result.pagination);
});

export const getReturn = asyncHandler(async (req, res) => {
  const ret = await ReturnService.getReturnById(req.params.id);
  sendSuccess(res, ret);
});

export const getSaleReturnableInfo = asyncHandler(async (req, res) => {
  const info = await ReturnService.getReturnableSaleInfo(req.params.saleIdentifier);
  sendSuccess(res, info);
});

export const getReturnStats = asyncHandler(async (_req, res) => {
  const stats = await ReturnService.getReturnStats();
  sendSuccess(res, stats);
});

export const updateReturnStatus = asyncHandler(async (req, res) => {
  const parsed = updateReturnStatusSchema.safeParse(req.body);
  if (!parsed.success) { sendError(res, 'Validation failed', 400, parsed.error.errors); return; }
  const updated = await ReturnService.updateReturnStatus(req.params.id, parsed.data, req.user.userId);
  sendSuccess(res, updated, 'Return status updated successfully');
});
