import { NextRequest } from 'next/server';
import { registerUser } from '@/lib/auth';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { handleError } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { registerSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Register user
    const result = await registerUser(validatedData);

    // Generate tokens for the newly registered user
    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      companyId: result.company.id,
      role: result.user.role,
      permissions: result.user.permissions as string[],
    });
    const refreshToken = generateRefreshToken(result.user.id);

    const responseData = {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        companyId: result.company.id,
      },
      accessToken,
      refreshToken,
    };

    // Set cookies
    const response = successResponse(responseData, 201);
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
