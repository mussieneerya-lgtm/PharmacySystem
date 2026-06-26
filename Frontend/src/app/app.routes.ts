import { Routes } from '@angular/router';
import { authGuard, adminGuard, pharmacistGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public landing
  {
    path: '',
    loadComponent: () => import('./components/home/home').then(m => m.HomeComponent)
  },

  // Auth (redirect to dashboard if already logged in)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent)
  },

  // Public medicine search (also available inside dashboard)
  {
    path: 'search',
    loadComponent: () => import('./components/medicine-search/medicine-search').then(m => m.MedicineSearchComponent)
  },

  // Pharmacy registration (pharmacist, after signup)
  {
    path: 'pharmacy/register',
    canActivate: [pharmacistGuard],
    loadComponent: () => import('./components/pharmacy-register/pharmacy-register').then(m => m.PharmacyRegisterComponent)
  },

  // Dashboard shell — all authenticated routes live here
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent),
    children: [
      // Default redirect based on role is handled in LoginComponent; default child is search
      {
        path: '',
        redirectTo: 'search',
        pathMatch: 'full'
      },
      {
        path: 'search',
        loadComponent: () => import('./components/medicine-search/medicine-search').then(m => m.MedicineSearchComponent)
      },
      {
        path: 'medicines',
        canActivate: [pharmacistGuard],
        loadComponent: () => import('./components/medicine-management/medicine-management').then(m => m.MedicineManagementComponent)
      },
      {
        path: 'prescriptions',
        loadComponent: () => import('./components/prescription-management/prescription-management').then(m => m.PrescriptionManagementComponent)
      },
      {
        path: 'pharmacy',
        canActivate: [pharmacistGuard],
        loadComponent: () => import('./components/pharmacy-register/pharmacy-register').then(m => m.PharmacyRegisterComponent)
      },

      // Admin routes
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin-panel/admin-panel').then(m => m.AdminPanelComponent)
      },
      {
        path: 'admin/pharmacies',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin-panel/admin-panel').then(m => m.AdminPanelComponent)
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/admin-panel/admin-panel').then(m => m.AdminPanelComponent)
      },

      // Profile — available to all authenticated roles
      {
        path: 'profile',
        loadComponent: () => import('./components/profile/profile').then(m => m.ProfileComponent)
      }
    ]
  },

  // Catch-all
  { path: '**', redirectTo: '' }
];
