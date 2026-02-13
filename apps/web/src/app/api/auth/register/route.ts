import { NextRequest } from 'next/server';
import { registerUser } from '@/lib/auth';
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

    return successResponse(
      {
        message: 'Registration successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName
        },
        company: {
          id: result.company.id,
          name: result.company.companyName
        }
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
