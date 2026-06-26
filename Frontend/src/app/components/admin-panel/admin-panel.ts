import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PharmacyService } from '../../services/pharmacy.service';
import { AuthService } from '../../services/auth.service';
import { PharmacyDto } from '../../models/pharmacy.models';
import { UserDto } from '../../models/auth.models';

type AdminTab = 'pharmacies' | 'users';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss'
})
export class AdminPanelComponent implements OnInit {
  activeTab = signal<AdminTab>('pharmacies');

  pharmacies = signal<PharmacyDto[]>([]);
  users = signal<UserDto[]>([]);
  loadingPharmacies = signal(false);
  loadingUsers = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(
    private pharmacyService: PharmacyService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPharmacies();
    this.loadUsers();
  }

  loadPharmacies(): void {
    this.loadingPharmacies.set(true);
    this.pharmacyService.getAllAdmin().subscribe({
      next: (list) => { this.pharmacies.set(list); this.loadingPharmacies.set(false); },
      error: () => this.loadingPharmacies.set(false)
    });
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.authService.getUsers().subscribe({
      next: (list) => { this.users.set(list); this.loadingUsers.set(false); },
      error: () => this.loadingUsers.set(false)
    });
  }

  approvePharmacy(id: number): void {
    this.pharmacyService.updateStatus(id, { status: 1 }).subscribe({
      next: () => { this.loadPharmacies(); this.showSuccess('Pharmacy approved.'); },
      error: (err) => this.errorMsg.set(err.error?.message ?? 'Action failed.')
    });
  }

  rejectPharmacy(id: number): void {
    this.pharmacyService.updateStatus(id, { status: 2 }).subscribe({
      next: () => { this.loadPharmacies(); this.showSuccess('Pharmacy rejected.'); },
      error: (err) => this.errorMsg.set(err.error?.message ?? 'Action failed.')
    });
  }

  toggleUser(userId: number): void {
    this.authService.toggleActive(userId).subscribe({
      next: () => { this.loadUsers(); this.showSuccess('User status updated.'); },
      error: (err) => this.errorMsg.set(err.error?.message ?? 'Action failed.')
    });
  }

  get pendingCount(): number {
    return this.pharmacies().filter(p => p.status === 'Pending').length;
  }

  get approvedCount(): number {
    return this.pharmacies().filter(p => p.status === 'Approved').length;
  }

  get activeUserCount(): number {
    return this.users().filter(u => u.isActive).length;
  }

  statusClass(status: string): string {
    return { Pending: 'badge-pending', Approved: 'badge-approved', Rejected: 'badge-rejected' }[status] ?? '';
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }
}
