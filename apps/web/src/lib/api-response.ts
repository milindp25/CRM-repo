import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data
    },
    { status: statusCode }
  );
}

export function errorResponse(
  message: string,
  code: string,
  statusCode: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details
      }
    },
    { status: statusCode }
  );
}
