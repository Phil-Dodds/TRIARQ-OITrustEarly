// app-routing.module.ts — Pathways OI Trust
// All routes are relative — no hardcoded absolute paths (D-143).
// Feature modules are lazy-loaded.
// AuthGuard protects all routes except /login and /auth/verify-otp.

import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent }       from './features/login/login.component';
import { OtpVerifyComponent }   from './features/login/otp-verify.component';
import { authGuard }            from './core/guards/auth.guard';

const routes: Routes = [
  { path: 'login',           component: LoginComponent },
  // No authGuard — OTP entry runs before a session exists. Direct navigation
  // without router state redirects back to /login (D-354).
  { path: 'auth/verify-otp', component: OtpVerifyComponent },

  {
    path: 'home',
    canActivate: [authGuard],
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'library',
    canActivate: [authGuard],
    loadChildren: () => import('./features/oi-library/oi-library.module').then(m => m.OILibraryModule)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadChildren: () => import('./features/chat/chat.module').then(m => m.ChatModule)
  },
  {
    path: 'delivery',
    canActivate: [authGuard],
    loadChildren: () => import('./features/delivery/delivery.module').then(m => m.DeliveryModule)
  },

  {
    path: 'contact-admin',
    canActivate: [authGuard],
    loadComponent: () => import('./features/contact-admin/contact-admin.component').then(m => m.ContactAdminComponent)
  },

  { path: '',     redirectTo: 'home', pathMatch: 'full' },
  { path: '**',   redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
