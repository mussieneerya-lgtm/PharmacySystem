/**
 * PharmacyLocation — used exclusively by the Pharmacies Map feature.
 * Maps directly to PharmacyDto from GET /api/pharmacy, with coordinates
 * surfaced as top-level fields for Leaflet consumption.
 */
export interface PharmacyLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  isOpen: boolean;
  licenseNumber: string;
  ownerName: string;
  registeredAt: string;
  approvedAt?: string;
}
