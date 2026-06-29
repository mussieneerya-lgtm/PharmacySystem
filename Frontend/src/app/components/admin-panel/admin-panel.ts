import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PharmacyService } from '../../services/pharmacy.service';
import { AuthService }    from '../../services/auth.service';
import { PharmacyDto }    from '../../models/pharmacy.models';
import { UserDto }        from '../../models/auth.models';

type AdminTab = 'pharmacies' | 'users';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss'
})
export class AdminPanelComponent implements OnInit {
  activeTab = signal<AdminTab>('pharmacies');

  pharmacies        = signal<PharmacyDto[]>([]);
  users             = signal<UserDto[]>([]);
  loadingPharmacies = signal(false);
  loadingUsers      = signal(false);
  errorMsg          = signal('');
  successMsg        = signal('');

  // ── Coordinates edit modal ─────────────────────────────────────────────
  editTarget   = signal<PharmacyDto | null>(null);
  editLat      = '';
  editLng      = '';
  editIsOpen   = true;
  savingCoords = signal(false);
  coordsError  = signal('');

  constructor(
    private pharmacyService: PharmacyService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPharmacies();
    this.loadUsers();
  }

  // ── Data loading ───────────────────────────────────────────────────────
  loadPharmacies(): void {
    this.loadingPharmacies.set(true);
    this.pharmacyService.getAllAdmin().subscribe({
      next:  (list) => { this.pharmacies.set(list); this.loadingPharmacies.set(false); },
      error: ()     => this.loadingPharmacies.set(false)
    });
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.authService.getUsers().subscribe({
      next:  (list) => { this.users.set(list); this.loadingUsers.set(false); },
      error: ()     => this.loadingUsers.set(false)
    });
  }

  // ── Pharmacy actions ───────────────────────────────────────────────────
  approvePharmacy(id: number): void {
    this.pharmacyService.updateStatus(id, { status: 1 }).subscribe({
      next:  () => { this.loadPharmacies(); this.showSuccess('Pharmacy approved.'); },
      error: (err) => this.errorMsg.set(err.error?.message ?? 'Action failed.')
    });
  }

  rejectPharmacy(id: number): void {
    this.pharmacyService.updateStatus(id, { status: 2 }).subscribe({
      next:  () => { this.loadPharmacies(); this.showSuccess('Pharmacy rejected.'); },
      error: (err) => this.errorMsg.set(err.error?.message ?? 'Action failed.')
    });
  }

  // ── Coordinates modal ──────────────────────────────────────────────────
  openEditCoords(ph: PharmacyDto): void {
    this.editTarget.set(ph);
    this.editLat    = ph.latitude  != null ? String(ph.latitude)  : '';
    this.editLng    = ph.longitude != null ? String(ph.longitude) : '';
    this.editIsOpen = ph.isOpen;
    this.coordsError.set('');
  }

  closeEditCoords(): void {
    this.editTarget.set(null);
    this.coordsError.set('');
  }

  saveCoords(): void {
    const target = this.editTarget();
    if (!target) return;

    const lat = parseFloat(this.editLat);
    const lng = parseFloat(this.editLng);

    if (this.editLat !== '' && (isNaN(lat) || lat < -90  || lat > 90)) {
      this.coordsError.set('Latitude must be a number between -90 and 90.');
      return;
    }
    if (this.editLng !== '' && (isNaN(lng) || lng < -180 || lng > 180)) {
      this.coordsError.set('Longitude must be a number between -180 and 180.');
      return;
    }

    this.savingCoords.set(true);
    this.coordsError.set('');

    const dto = {
      latitude:  this.editLat !== '' ? lat : null,
      longitude: this.editLng !== '' ? lng : null,
      isOpen:    this.editIsOpen
    };

    this.pharmacyService.update(target.id, dto).subscribe({
      next: () => {
        this.savingCoords.set(false);
        this.closeEditCoords();
        this.loadPharmacies();
        this.showSuccess(`Coordinates saved for ${target.name}.`);
      },
      error: (err) => {
        this.savingCoords.set(false);
        this.coordsError.set(err.error?.message ?? 'Failed to save coordinates.');
      }
    });
  }

  // ── User actions ───────────────────────────────────────────────────────
  toggleUser(userId: number): void {
    this.authService.toggleActive(userId).subscribe({
      next:  () => { this.loadUsers(); this.showSuccess('User status updated.'); },
      error: (err) => this.errorMsg.set(err.error?.message ?? 'Action failed.')
    });
  }

  // ── Computed helpers ───────────────────────────────────────────────────
  get pendingCount():    number { return this.pharmacies().filter(p => p.status === 'Pending').length; }
  get approvedCount():   number { return this.pharmacies().filter(p => p.status === 'Approved').length; }
  get activeUserCount(): number { return this.users().filter(u => u.isActive).length; }

  statusClass(status: string): string {
    return { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' }[status] ?? '';
  }

  coordsLabel(ph: PharmacyDto): string {
    return ph.latitude != null && ph.longitude != null
      ? `${ph.latitude.toFixed(4)}, ${ph.longitude.toFixed(4)}`
      : '—';
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3500);
  }
}
