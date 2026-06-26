import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProfileDto, UpdateProfileDto } from '../models/auth.models';

const API = 'http://localhost:5211/api/profile';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  /** GET /api/profile — fetch the current user's profile */
  getProfile(): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(API);
  }

  /**
   * PUT /api/profile — update text fields and optionally upload a new logo.
   * Sends multipart/form-data so the backend receives both the DTO fields
   * and the file in a single request.
   */
  updateProfile(dto: UpdateProfileDto, logo?: File): Observable<ProfileDto> {
    const form = new FormData();
    form.append('fullName', dto.fullName);
    form.append('email',    dto.email);
    form.append('phone',    dto.phone ?? '');

    if (logo) {
      form.append('logo', logo, logo.name);
    }

    // Do NOT set Content-Type manually — the browser must set the
    // multipart boundary automatically when using FormData.
    return this.http.put<ProfileDto>(API, form);
  }
}
