import { LoginDto, RegisterDto, AuthResponseDto } from '../dto';

/**
 * Auth Service Interface (for Dependency Inversion Principle)
 * Allows for different implementations and easier testing
 */
export interface IAuthService {
  register(dto: RegisterDto): Promise<AuthResponseDto>;
  login(dto: LoginDto): Promise<AuthResponseDto>;
  refreshToken(refreshToken: string): Promise<AuthResponseDto>;
  logout(userId: string): Promise<void>;
}
