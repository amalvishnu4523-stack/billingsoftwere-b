import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { config } from '../config/env.js';

function generateTokens(userId, email, role) {
  const accessToken = jwt.sign({ userId, email, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  const refreshToken = jwt.sign({ userId, email, role }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

function sanitizeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
  };
}

export async function setupAdmin(data) {
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const result = await User.collection.findOneAndUpdate(
    { role: 'admin' },
    {
      $setOnInsert: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    },
    { upsert: true, returnDocument: 'before' }
  );

  if (result !== null) {
    throw Object.assign(new Error('Admin already set up'), { statusCode: 409 });
  }

  const user = await User.findOne({ role: 'admin', email: data.email });
  if (!user) {
    throw Object.assign(new Error('Setup failed unexpectedly'), { statusCode: 500 });
  }

  const settingsCount = await BusinessSettings.countDocuments();
  if (settingsCount === 0) {
    await BusinessSettings.create({ shopName: data.shopName ?? 'My Shop' });
  }

  return sanitizeUser(user.toObject());
}

export async function loginUser(data) {
  const user = await User.findOne({ email: data.email }).select('+password +refreshTokenHash');
  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (!user.isActive) {
    throw Object.assign(new Error('Account is deactivated'), { statusCode: 403 });
  }

  const isMatch = await user.comparePassword(data.password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  user.lastLogin = new Date();
  const tokens = generateTokens(String(user._id), user.email, user.role);
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
  await user.save();

  return { user: sanitizeUser(user.toObject()), tokens };
}

export async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  const user = await User.findById(decoded.userId).select('+refreshTokenHash');
  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found or inactive'), { statusCode: 401 });
  }

  if (!user.refreshTokenHash) {
    throw Object.assign(new Error('No active session — please log in again'), { statusCode: 401 });
  }

  const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!isValid) {
    user.refreshTokenHash = undefined;
    await user.save();
    throw Object.assign(
      new Error('Refresh token reuse detected — session invalidated'),
      { statusCode: 401 }
    );
  }

  const tokens = generateTokens(String(user._id), user.email, user.role);
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
  await user.save();

  return tokens;
}

export async function revokeRefreshToken(userId) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: '' } });
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return sanitizeUser(user.toObject());
}
