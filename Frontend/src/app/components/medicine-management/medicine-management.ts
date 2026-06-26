import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MedicineService } from '../../services/medicine.service';
import { MedicineDto, CreateMedicineDto, UpdateMedicineDto } from '../../models/medicine.models';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-medicine-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './medicine-management.html',
  styleUrl: './medicine-management.scss'
})
export class MedicineManagementComponent implements OnInit {
  medicines = signal<MedicineDto[]>([]);
  loading   = signal(false);
  saving    = signal(false);
  errorMsg  = signal('');
  successMsg = signal('');

  modalMode       = signal<ModalMode>(null);
  selectedMedicine = signal<MedicineDto | null>(null);
  deleteTarget    = signal<MedicineDto | null>(null);

  // ── Live filter ────────────────────────────────────────────────────────
  filterQuery = '';

  filteredMedicines = computed(() => {
    const q = this.filterQuery.trim().toLowerCase();
    if (!q) return this.medicines();
    return this.medicines().filter(m =>
      m.name.toLowerCase().includes(q)         ||
      m.genericName.toLowerCase().includes(q)  ||
      m.category.toLowerCase().includes(q)     ||
      m.manufacturer.toLowerCase().includes(q) ||
      m.strength.toLowerCase().includes(q)
    );
  });

  // ── KPI cards ──────────────────────────────────────────────────────────
  totalMedicines = computed(() => this.medicines().length);
  totalStock     = computed(() => this.medicines().reduce((sum, m) => sum + m.stockQuantity, 0));
  lowStockCount  = computed(() => this.medicines().filter(m => m.stockQuantity < 10 && m.isActive).length);

  form!: FormGroup;

  readonly categories = [
    'Antibiotics', 'Analgesics', 'Antidiabetics', 'Antihypertensives',
    'Antihistamines', 'Vitamins & Supplements', 'Gastrointestinal',
    'Respiratory', 'Dermatology', 'Ophthalmology', 'Other'
  ];

  readonly dosageForms = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream',
    'Drops', 'Inhaler', 'Patch', 'Suppository', 'Other'
  ];

  constructor(private fb: FormBuilder, private medicineService: MedicineService) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadMedicines();
  }

  private buildForm(m?: MedicineDto): void {
    this.form = this.fb.group({
      name:                 [m?.name ?? '',          [Validators.required]],
      genericName:          [m?.genericName ?? '',   [Validators.required]],
      manufacturer:         [m?.manufacturer ?? '',  [Validators.required]],
      category:             [m?.category ?? '',      [Validators.required]],
      description:          [m?.description ?? ''],
      price:                [m?.price ?? 0,          [Validators.required, Validators.min(0)]],
      stockQuantity:        [m?.stockQuantity ?? 0,  [Validators.required, Validators.min(0)]],
      requiresPrescription: [m?.requiresPrescription ?? false],
      dosageForm:           [m?.dosageForm ?? '',    [Validators.required]],
      strength:             [m?.strength ?? '',      [Validators.required]],
      expiryDate:           [m ? m.expiryDate.substring(0, 10) : '', [Validators.required]]
    });
  }

  loadMedicines(): void {
    this.loading.set(true);
    this.medicineService.getMine().subscribe({
      next: (list) => { this.medicines.set(list); this.loading.set(false); },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to load medicines.');
        this.loading.set(false);
      }
    });
  }

  openCreate(): void {
    this.buildForm();
    this.selectedMedicine.set(null);
    this.modalMode.set('create');
    this.errorMsg.set('');
  }

  openEdit(m: MedicineDto): void {
    this.buildForm(m);
    this.selectedMedicine.set(m);
    this.modalMode.set('edit');
    this.errorMsg.set('');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selectedMedicine.set(null);
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');

    if (this.modalMode() === 'create') {
      const dto: CreateMedicineDto = this.form.value;
      this.medicineService.create(dto).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.loadMedicines(); this.showSuccess('Medicine added successfully.'); },
        error: (err) => { this.saving.set(false); this.errorMsg.set(err.error?.message ?? 'Failed to save.'); }
      });
    } else {
      const dto: UpdateMedicineDto = this.form.value;
      this.medicineService.update(this.selectedMedicine()!.id, dto).subscribe({
        next: () => { this.saving.set(false); this.closeModal(); this.loadMedicines(); this.showSuccess('Medicine updated successfully.'); },
        error: (err) => { this.saving.set(false); this.errorMsg.set(err.error?.message ?? 'Failed to update.'); }
      });
    }
  }

  confirmDelete(m: MedicineDto): void { this.deleteTarget.set(m); }
  cancelDelete():  void { this.deleteTarget.set(null); }

  doDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.medicineService.delete(target.id).subscribe({
      next: () => { this.deleteTarget.set(null); this.loadMedicines(); this.showSuccess('Medicine removed.'); },
      error: (err) => this.errorMsg.set(err.error?.message ?? 'Delete failed.')
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  isExpiringSoon(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    return expiry <= soon;
  }
}
