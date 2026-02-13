import { NextRequest } from 'next/server';
import { loginUser } from '@/lib/auth';
import { handleError } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { loginSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Login user
    const result = await loginUser(validatedData.email, validatedData.password);

    // Set cookies
    const response = successResponse(result);
    response.cookies.set('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    response.cookies.set('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
