import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  setupAdmin,
  loginUser,
  refreshAccessToken,
  revokeRefreshToken,
  getMe,
} from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { config } from '../config/env.js';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_SCOPE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? 'none' : 'strict',
  ...(config.cookieDomain && { domain: config.cookieDomain }),
};
const COOKIE_OPTIONS = {
  ...COOKIE_SCOPE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const setupController = asyncHandler(async (req, res) => {
  const user = await setupAdmin(req.body);
  sendSuccess(res, { user }, 'Admin account created successfully', 201);
});

export const loginController = asyncHandler(async (req, res) => {
  const { user, tokens } = await loginUser(req.body);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
  sendSuccess(res, { accessToken: tokens.accessToken, user }, 'Login successful');
});

export const refreshController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE];
  if (!refreshToken) {
    return sendError(res, 'No refresh token', 401);
  }
  const tokens = await refreshAccessToken(refreshToken);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
  sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
});

export const logoutController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE];
  if (refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.userId) {
        await revokeRefreshToken(decoded.userId);
      }
    } catch {
      // ignore
    }
  }
  res.clearCookie(REFRESH_COOKIE, COOKIE_SCOPE_OPTIONS);
  sendSuccess(res, null, 'Logged out successfully');
});

export const meController = asyncHandler(async (req, res) => {
  const user = await getMe(req.user.userId);
  sendSuccess(res, { user });
});
