import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PharmacyService } from '../../services/pharmacy.service';

@Component({
  selector: 'app-pharmacy-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pharmacy-register.html',
  styleUrl: './pharmacy-register.scss'
})
export class PharmacyRegisterComponent {
  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private pharmacyService: PharmacyService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      licenseNumber: ['', [Validators.required, Validators.minLength(4)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[+0-9\s\-()]{7,20}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get name()          { return this.form.get('name')!; }
  get licenseNumber() { return this.form.get('licenseNumber')!; }
  get address()       { return this.form.get('address')!; }
  get city()          { return this.form.get('city')!; }
  get phone()         { return this.form.get('phone')!; }
  get email()         { return this.form.get('email')!; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    this.pharmacyService.register(this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMsg.set(res.message);
        setTimeout(() => this.router.navigate(['/dashboard/pharmacy']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message ?? 'Registration failed. Please try again.');
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
