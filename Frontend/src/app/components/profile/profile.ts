import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { AuthService }    from '../../services/auth.service';
import { ProfileDto }     from '../../models/auth.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;

  profile   = signal<ProfileDto | null>(null);
  loading   = signal(true);
  saving    = signal(false);
  errorMsg  = signal('');
  successMsg = signal('');

  // Logo preview & file selection
  selectedFile    = signal<File | null>(null);
  previewUrl      = signal<string | null>(null);
  isDragOver      = signal(false);

  readonly API_BASE = 'http://localhost:5211';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadProfile();
  }

  private buildForm(p?: ProfileDto): void {
    this.form = this.fb.group({
      fullName: [p?.fullName ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      email:    [p?.email    ?? '', [Validators.required, Validators.email, Validators.maxLength(200)]],
      phone:    [p?.phone    ?? '', [Validators.maxLength(30)]]
    });
  }

  loadProfile(): void {
    this.loading.set(true);
    this.profileService.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.buildForm(p);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to load profile.');
        this.loading.set(false);
      }
    });
  }

  // ── File selection ─────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.handleFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File): void {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.errorMsg.set('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.errorMsg.set('Image must be 2 MB or smaller.');
      return;
    }
    this.errorMsg.set('');
    this.selectedFile.set(file);

    // Build local preview immediately — no server round-trip needed
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearLogo(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  // ── Save ───────────────────────────────────────────────────────────────

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');

    this.profileService.updateProfile(
      this.form.value,
      this.selectedFile() ?? undefined
    ).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.profile.set(updated);
        this.selectedFile.set(null);
        this.previewUrl.set(null);

        // Propagate logo + name change into the sidebar immediately
        this.authService.patchCurrentUser({
          fullName: updated.fullName,
          logoUrl:  updated.logoUrl
        });

        this.showSuccess('Profile saved successfully.');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err.error?.message ?? 'Failed to save profile.');
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  /** Returns the URL to display in the current logo preview area. */
  get displayLogoUrl(): string | null {
    // Local preview takes priority while a new file is staged
    if (this.previewUrl()) return this.previewUrl();
    const saved = this.profile()?.logoUrl;
    return saved ? `${this.API_BASE}${saved}` : null;
  }

  get initials(): string {
    return (this.profile()?.fullName ?? '?')
      .split(' ')
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }
}
