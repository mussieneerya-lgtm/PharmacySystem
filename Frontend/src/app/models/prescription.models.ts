export interface CreatePrescriptionItemDto {
  medicineId: number;
  quantity: number;
  instructions: string;
}

export interface CreatePrescriptionDto {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  notes: string;
  pharmacyId: number;
  items: CreatePrescriptionItemDto[];
}

export interface UpdatePrescriptionStatusDto {
  status: 0 | 1 | 2; // Pending=0, Filled=1, Cancelled=2
}

export interface PrescriptionItemDto {
  id: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
  instructions: string;
}

export interface PrescriptionDto {
  id: number;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  notes: string;
  status: 'Pending' | 'Filled' | 'Cancelled';
  issuedDate: string;
  filledDate?: string;
  pharmacyId: number;
  pharmacyName: string;
  issuedByUserName: string;
  items: PrescriptionItemDto[];
}
