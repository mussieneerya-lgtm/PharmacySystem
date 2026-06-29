import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PharmacyLocation } from '../models/pharmacy-location.model';
import { PharmacyDto } from '../models/pharmacy.models';

const API = 'http://localhost:5211/api/pharmacy';

@Injectable({ providedIn: 'root' })
export class PharmacyMapService {
  constructor(private http: HttpClient) {}

  /**
   * Fetches all approved pharmacies and maps them to PharmacyLocation.
   * No query params are used here — filtering is done client-side so the
   * map does not re-initialise on every keystroke.
   */
  getLocations(): Observable<PharmacyLocation[]> {
    return this.http.get<PharmacyDto[]>(API).pipe(
      map(dtos => dtos.map(d => this.toLocation(d)))
    );
  }

  /**
   * Extracts a sorted, deduplicated list of city names from a location array.
   * Pure function — no HTTP call.
   */
  getCities(locations: PharmacyLocation[]): string[] {
    return [...new Set(locations.map(l => l.city).filter(Boolean))].sort();
  }

  private toLocation(d: PharmacyDto): PharmacyLocation {
    return {
      id:            d.id,
      name:          d.name,
      address:       d.address,
      city:          d.city,
      phone:         d.phone,
      email:         d.email,
      status:        d.status,
      latitude:      d.latitude,
      longitude:     d.longitude,
      isOpen:        d.isOpen,
      licenseNumber: d.licenseNumber,
      ownerName:     d.ownerName,
      registeredAt:  d.registeredAt,
      approvedAt:    d.approvedAt,
    };
  }
}
