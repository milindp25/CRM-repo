/**
 * JWT Payload Interface
 * Used for both access tokens and token verification
 */
export interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

/**
 * User Profile Interface
 * Returned after successful authentication
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
}

/**
 * Authentication Response Interface
 * Standard response format for auth endpoints
 */
export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}
