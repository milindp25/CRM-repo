import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  companyCode: string;

  @IsOptional()
  @IsString()
  subscriptionTier?: string;

  @IsOptional()
  @IsString()
  subscriptionStatus?: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsNotEmpty()
  @IsString()
  adminFirstName: string;

  @IsNotEmpty()
  @IsString()
  adminLastName: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}
