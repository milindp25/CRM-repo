import { NextResponse } from 'next/server';
import { AppError } from './errors';
import logger from './logger';

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    logger.error({
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      },
      { status: error.statusCode }
    );
  }

  // Unknown error
  logger.error({
    message: 'Unexpected error',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    },
    { status: 500 }
  );
}
