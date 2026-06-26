export interface CreatePharmacyDto {
  name: string;
  licenseNumber: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

export interface UpdatePharmacyDto {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

export interface PharmacyDto {
  id: number;
  name: string;
  licenseNumber: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  registeredAt: string;
  approvedAt?: string;
  ownerId: number;
  ownerName: string;
}

export interface ApprovePharmacyDto {
  status: 0 | 1 | 2; // Pending=0, Approved=1, Rejected=2
}
