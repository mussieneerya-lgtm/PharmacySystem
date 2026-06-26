import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MedicineService } from '../../services/medicine.service';
import { MedicineDto, PagedResult } from '../../models/medicine.models';

@Component({
  selector: 'app-medicine-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medicine-search.html',
  styleUrl: './medicine-search.scss'
})
export class MedicineSearchComponent implements OnInit {
  result = signal<PagedResult<MedicineDto>>({
    items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0
  });
  loading = signal(false);
  searched = signal(false);
  selectedMedicine = signal<MedicineDto | null>(null);

  filterForm!: FormGroup;

  readonly categories = [
    'Antibiotics', 'Analgesics', 'Antidiabetics', 'Antihypertensives',
    'Antihistamines', 'Vitamins & Supplements', 'Gastrointestinal',
    'Respiratory', 'Dermatology', 'Ophthalmology', 'Other'
  ];

  constructor(private fb: FormBuilder, private medicineService: MedicineService) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      name:                 [''],
      category:             [''],
      city:                 [''],
      requiresPrescription: [null],
      maxPrice:             [null]
    });

    // Auto-search on name changes (debounced)
    this.filterForm.get('name')!.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.search(1));
  }

  search(page = 1): void {
    this.loading.set(true);
    this.searched.set(true);

    const raw = this.filterForm.value;
    const filter = {
      name:                 raw.name || undefined,
      category:             raw.category || undefined,
      city:                 raw.city || undefined,
      requiresPrescription: raw.requiresPrescription === 'true' ? true
                          : raw.requiresPrescription === 'false' ? false
                          : undefined,
      maxPrice:             raw.maxPrice ? +raw.maxPrice : undefined,
      page,
      pageSize: 20
    };

    this.medicineService.search(filter).subscribe({
      next: (res) => { this.result.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.searched.set(false);
    this.result.set({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
  }

  viewMedicine(m: MedicineDto): void { this.selectedMedicine.set(m); }
  closeDetail(): void { this.selectedMedicine.set(null); }

  get pages(): number[] {
    return Array.from({ length: this.result().totalPages }, (_, i) => i + 1);
  }

  isExpiringSoon(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expiry <= thirtyDays;
  }
}
