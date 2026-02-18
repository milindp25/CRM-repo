/**
 * JWT Payload Interface
 * Defines the structure of data stored in JWT tokens
 */
export interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}
