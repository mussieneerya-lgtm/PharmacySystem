import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PrescriptionDto, CreatePrescriptionDto, UpdatePrescriptionStatusDto
} from '../models/prescription.models';

const API = 'http://localhost:5211/api/prescription';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<PrescriptionDto[]> {
    return this.http.get<PrescriptionDto[]>(API);
  }

  getById(id: number): Observable<PrescriptionDto> {
    return this.http.get<PrescriptionDto>(`${API}/${id}`);
  }

  create(dto: CreatePrescriptionDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(API, dto);
  }

  updateStatus(id: number, dto: UpdatePrescriptionStatusDto): Observable<{ id: number; status: string }> {
    return this.http.patch<{ id: number; status: string }>(`${API}/${id}/status`, dto);
  }

  cancel(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`);
  }
}
