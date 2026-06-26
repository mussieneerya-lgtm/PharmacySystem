import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { PrescriptionService } from '../../services/prescription.service';
import { MedicineService } from '../../services/medicine.service';
import { PharmacyService } from '../../services/pharmacy.service';
import { AuthService } from '../../services/auth.service';
import { PrescriptionDto } from '../../models/prescription.models';
import { MedicineDto } from '../../models/medicine.models';
import { PharmacyDto } from '../../models/pharmacy.models';

@Component({
  selector: 'app-prescription-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prescription-management.html',
  styleUrl: './prescription-management.scss'
})
export class PrescriptionManagementComponent implements OnInit {
  prescriptions = signal<PrescriptionDto[]>([]);
  medicines = signal<MedicineDto[]>([]);
  pharmacies = signal<PharmacyDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  showCreateModal = signal(false);
  selectedPrescription = signal<PrescriptionDto | null>(null);

  form!: FormGroup;

  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly isPharmacist = computed(() => this.authService.isPharmacist());

  readonly statusOptions = [
    { label: 'Pending',   value: 0 },
    { label: 'Filled',    value: 1 },
    { label: 'Cancelled', value: 2 }
  ];

  constructor(
    private fb: FormBuilder,
    private prescriptionService: PrescriptionService,
    private medicineService: MedicineService,
    private pharmacyService: PharmacyService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadPrescriptions();
    this.pharmacyService.getAll().subscribe({ next: (list) => this.pharmacies.set(list) });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      patientName:  ['', Validators.required],
      patientPhone: ['', [Validators.required, Validators.pattern(/^[+0-9\s\-()]{7,20}$/)]],
      doctorName:   ['', Validators.required],
      notes:        [''],
      pharmacyId:   [null, Validators.required],
      items: this.fb.array([this.createItemGroup()])
    });
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      medicineId:   [null, Validators.required],
      quantity:     [1, [Validators.required, Validators.min(1)]],
      instructions: ['']
    });
  }

  get items(): FormArray { return this.form.get('items') as FormArray; }

  addItem(): void { this.items.push(this.createItemGroup()); }
  removeItem(i: number): void { if (this.items.length > 1) this.items.removeAt(i); }

  onPharmacyChange(pharmacyId: number): void {
    this.medicines.set([]);
    if (!pharmacyId) return;
    this.medicineService.search({ page: 1, pageSize: 100 }).subscribe({
      next: (res) => this.medicines.set(res.items.filter(m => m.pharmacyId === +pharmacyId))
    });
  }

  loadPrescriptions(): void {
    this.loading.set(true);
    this.prescriptionService.getAll().subscribe({
      next: (list) => { this.prescriptions.set(list); this.loading.set(false); },
      error: (err) => { this.errorMsg.set(err.error?.message ?? 'Failed to load.'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.buildForm();
    this.showCreateModal.set(true);
    this.errorMsg.set('');
  }

  closeModal(): void {
    this.showCreateModal.set(false);
    this.selectedPrescription.set(null);
  }

  viewDetail(p: PrescriptionDto): void { this.selectedPrescription.set(p); }
  closeDetail(): void { this.selectedPrescription.set(null); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');

    this.prescriptionService.create(this.form.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadPrescriptions();
        this.showSuccess('Prescription created successfully.');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err.error?.message ?? 'Failed to create prescription.');
      }
    });
  }

  updateStatus(id: number, statusValue: number): void {
    this.prescriptionService.updateStatus(id, { status: statusValue as 0 | 1 | 2 }).subscribe({
      next: () => { this.loadPrescriptions(); this.showSuccess('Status updated.'); },
      error: (err) => this.errorMsg.set(err.error?.message ?? 'Update failed.')
    });
  }

  cancel(id: number): void {
    this.prescriptionService.cancel(id).subscribe({
      next: () => { this.loadPrescriptions(); this.showSuccess('Prescription cancelled.'); },
      error: (err) => this.errorMsg.set(err.error?.message ?? 'Cancel failed.')
    });
  }

  statusClass(status: string): string {
    return { Pending: 'badge-pending', Filled: 'badge-filled', Cancelled: 'badge-cancelled' }[status] ?? '';
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }
}
