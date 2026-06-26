import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());
  readonly role = computed(() => this.authService.userRole());

  constructor(private authService: AuthService) {}

  get dashboardRoute(): string {
    const r = this.role();
    if (r === 'Admin')      return '/dashboard/admin';
    if (r === 'Pharmacist') return '/dashboard/pharmacy';
    return '/dashboard/search';
  }
}
