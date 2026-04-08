export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  companyId?: string;
  phone?: string;
  address?: string;
  country?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  address: string;
  country: string;
  timezone: string;
}
