import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

const API_BASE = 'http://localhost:5211';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  sidebarOpen = signal(true);

  readonly user        = computed(() => this.authService.currentUser());
  readonly role        = computed(() => this.authService.userRole());
  readonly isAdmin     = computed(() => this.authService.isAdmin());
  readonly isPharmacist = computed(() => this.authService.isPharmacist());

  /** Absolute URL for the sidebar logo image, or null when not set. */
  readonly logoUrl = computed(() => {
    const raw = this.authService.currentUser()?.logoUrl;
    return raw ? `${API_BASE}${raw}` : null;
  });

  readonly navItems = computed(() => {
    const role = this.role();
    const base = [
      { label: 'Search Medicines', icon: '🔍', route: '/dashboard/search' }
    ];
    const pharmacistItems = [
      { label: 'My Pharmacy',   icon: '🏥', route: '/dashboard/pharmacy' },
      { label: 'Medicines',     icon: '💊', route: '/dashboard/medicines' },
      { label: 'Prescriptions', icon: '📋', route: '/dashboard/prescriptions' }
    ];
    const adminItems = [
      { label: 'Admin Panel',    icon: '⚙️', route: '/dashboard/admin' },
      { label: 'All Pharmacies', icon: '🏥', route: '/dashboard/admin/pharmacies' },
      { label: 'Users',          icon: '👥', route: '/dashboard/admin/users' },
      { label: 'Prescriptions',  icon: '📋', route: '/dashboard/prescriptions' }
    ];

    const profileItem = { label: 'My Profile', icon: '👤', route: '/dashboard/profile' };

    if (role === 'Admin')      return [...base, ...adminItems,      profileItem];
    if (role === 'Pharmacist') return [...base, ...pharmacistItems, profileItem];
    return [...base,
      { label: 'My Prescriptions', icon: '📋', route: '/dashboard/prescriptions' },
      profileItem
    ];
  });

  constructor(public authService: AuthService) {}

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }
  logout(): void { this.authService.logout(); }
}
