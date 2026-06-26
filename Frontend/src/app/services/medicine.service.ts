import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MedicineDto, CreateMedicineDto, UpdateMedicineDto,
  MedicineSearchDto, PagedResult
} from '../models/medicine.models';

const API = 'http://localhost:5211/api/medicine';

@Injectable({ providedIn: 'root' })
export class MedicineService {
  constructor(private http: HttpClient) {}

  search(filter: MedicineSearchDto): Observable<PagedResult<MedicineDto>> {
    let params = new HttpParams();
    if (filter.name)    params = params.set('name', filter.name);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.city)    params = params.set('city', filter.city);
    if (filter.requiresPrescription != null)
      params = params.set('requiresPrescription', String(filter.requiresPrescription));
    if (filter.maxPrice != null) params = params.set('maxPrice', String(filter.maxPrice));
    params = params.set('page', String(filter.page ?? 1));
    params = params.set('pageSize', String(filter.pageSize ?? 20));
    return this.http.get<PagedResult<MedicineDto>>(API, { params });
  }

  getById(id: number): Observable<MedicineDto> {
    return this.http.get<MedicineDto>(`${API}/${id}`);
  }

  getMine(): Observable<MedicineDto[]> {
    return this.http.get<MedicineDto[]>(`${API}/my`);
  }

  create(dto: CreateMedicineDto): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(API, dto);
  }

  update(id: number, dto: UpdateMedicineDto): Observable<void> {
    return this.http.put<void>(`${API}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`);
  }
}
