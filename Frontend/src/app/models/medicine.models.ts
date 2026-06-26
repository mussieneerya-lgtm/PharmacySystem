export interface CreateMedicineDto {
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  requiresPrescription: boolean;
  dosageForm: string;
  strength: string;
  expiryDate: string;
}

export interface UpdateMedicineDto {
  name?: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  requiresPrescription?: boolean;
  dosageForm?: string;
  strength?: string;
  expiryDate?: string;
}

export interface MedicineDto {
  id: number;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  requiresPrescription: boolean;
  dosageForm: string;
  strength: string;
  expiryDate: string;
  isActive: boolean;
  pharmacyId: number;
  pharmacyName: string;
  // Computed alert flags — populated by the backend DTO
  isLowStock: boolean;
  isExpiringSoon: boolean;
}

export interface MedicineSearchDto {
  name?: string;
  category?: string;
  city?: string;
  requiresPrescription?: boolean;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
