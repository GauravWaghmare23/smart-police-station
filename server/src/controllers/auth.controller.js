import * as authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/response.js';
import asyncHandler from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerCitizen(req.body);
  return ApiResponse(res, 201, 'Citizen registered successfully', { user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser(email, password);
  
  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  return ApiResponse(res, 200, 'Logged in successfully', { user, accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return ApiResponse(res, 200, 'Logged out successfully');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshUserToken(token);
  
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  return ApiResponse(res, 200, 'Tokens refreshed successfully', { accessToken });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = req.user.toObject();
  delete user.password;
  return ApiResponse(res, 200, 'User profile fetched successfully', { user });
});
