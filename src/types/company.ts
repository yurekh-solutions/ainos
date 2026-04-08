export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  gstNumber?: string;
  taxId?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFormData {
  name: string;
  gstNumber?: string;
  taxId?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
}
