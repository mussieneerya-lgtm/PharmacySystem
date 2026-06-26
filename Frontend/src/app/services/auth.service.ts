import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthResponse, LoginDto, RegisterDto, UserDto } from '../models/auth.models';

const API = 'http://localhost:5211/api/auth';
const TOKEN_KEY = 'pharmacy_token';
const USER_KEY = 'pharmacy_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<AuthResponse | null>(this.loadUser());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => !!this._currentUser());
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'Admin');
  readonly isPharmacist = computed(() => this._currentUser()?.role === 'Pharmacist');

  constructor(private http: HttpClient, private router: Router) {}

  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/register`, dto).pipe(
      tap(res => this.persist(res))
    );
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/login`, dto).pipe(
      tap(res => this.persist(res))
    );
  }

  getMe(): Observable<UserDto> {
    return this.http.get<UserDto>(`${API}/me`);
  }

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${API}/users`);
  }

  toggleActive(userId: number): Observable<{ id: number; isActive: boolean }> {
    return this.http.patch<{ id: number; isActive: boolean }>(
      `${API}/users/${userId}/toggle-active`, {}
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Patch in-memory + localStorage after a profile update without a new login. */
  patchCurrentUser(patch: { fullName?: string; logoUrl?: string }): void {
    const current = this._currentUser();
    if (!current) return;
    const updated: AuthResponse = { ...current, ...patch };
    this.persist(updated);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res));
    this._currentUser.set(res);
  }

  private loadUser(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const user: AuthResponse = JSON.parse(raw);
      // Discard expired tokens
      if (new Date(user.expiresAt) < new Date()) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }
}
