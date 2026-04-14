// app-routing.module.ts — Pathways OI Trust
// All routes are relative — no hardcoded absolute paths (D-143).
// Feature modules are lazy-loaded.
// AuthGuard protects all routes except /login.

import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent }        from './features/login/login.component';
import { AuthCallbackComponent } from './features/login/auth-callback.component';
import { SetPasswordComponent }  from './features/login/set-password.component';
import { authGuard }             from './core/guards/auth.guard';

const routes: Routes = [
  { path: 'login',              component: LoginComponent },
  // No authGuard — Supabase redirects here with a token_hash for invite or recovery flows.
  { path: 'auth/set-password',  component: SetPasswordComponent },
  // No authGuard — Supabase redirects here with PKCE code for magic-link (legacy/re-enable path).
  { path: 'auth/callback',      component: AuthCallbackComponent },

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

  { path: '',      redirectTo: 'home', pathMatch: 'full' },
  { path: '**',   redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
