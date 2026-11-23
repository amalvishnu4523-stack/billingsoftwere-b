import { User } from '../models/User.js';

export async function getUsers() {
  return User.find().select('-password -refreshTokenHash').sort({ createdAt: -1 }).lean();
}

export async function createUser(data) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
  }
  const user = await User.create({
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    password: data.password,
    role: data.role,
    isActive: true,
  });
  const obj = user.toObject();
  const { password: _p, refreshTokenHash: _r, ...safe } = obj;
  return safe;
}

export async function updateUser(id, data) {
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  if (data.name) user.name = data.name.trim();
  if (data.role) user.role = data.role;
  if (data.isActive !== undefined) user.isActive = data.isActive;

  await user.save();
  return User.findById(id).select('-password -refreshTokenHash').lean();
}

export async function resetPassword(id, newPassword) {
  const user = await User.findById(id).select('+password');
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
}

export async function deleteUser(id, requestingUserId) {
  if (id === requestingUserId) {
    throw Object.assign(new Error('You cannot delete your own account'), { statusCode: 400 });
  }
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  await User.findByIdAndDelete(id);
}
