export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  role: 'Admin' | 'Pharmacist' | 'Customer';
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  fullName: string;
  userId: number;
  expiresAt: string;
  logoUrl: string;
}

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProfileDto {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  logoUrl: string;
  createdAt: string;
}

export interface UpdateProfileDto {
  fullName: string;
  email: string;
  phone: string;
}
