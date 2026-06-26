import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PharmacyDto, CreatePharmacyDto, UpdatePharmacyDto, ApprovePharmacyDto
} from '../models/pharmacy.models';

const API = 'http://localhost:5211/api/pharmacy';

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  constructor(private http: HttpClient) {}

  getAll(city?: string, name?: string): Observable<PharmacyDto[]> {
    let params = new HttpParams();
    if (city) params = params.set('city', city);
    if (name) params = params.set('name', name);
    return this.http.get<PharmacyDto[]>(API, { params });
  }

  getById(id: number): Observable<PharmacyDto> {
    return this.http.get<PharmacyDto>(`${API}/${id}`);
  }

  getAllAdmin(): Observable<PharmacyDto[]> {
    return this.http.get<PharmacyDto[]>(`${API}/admin/all`);
  }

  getMine(): Observable<PharmacyDto> {
    return this.http.get<PharmacyDto>(`${API}/my`);
  }

  register(dto: CreatePharmacyDto): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(API, dto);
  }

  update(id: number, dto: UpdatePharmacyDto): Observable<void> {
    return this.http.put<void>(`${API}/${id}`, dto);
  }

  updateStatus(id: number, dto: ApprovePharmacyDto): Observable<{ id: number; status: string }> {
    return this.http.patch<{ id: number; status: string }>(`${API}/${id}/status`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`);
  }
}
