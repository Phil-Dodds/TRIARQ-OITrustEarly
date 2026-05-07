// app.module.ts — Pathways OI Trust
// Native Federation remote — exposed module: AppModule (D-143).
// Feature modules are lazy-loaded. No eagerly imported feature code here.
// Zero Supabase client imports — auth is in AuthService only.

import { NgModule }                  from '@angular/core';
import { BrowserModule }             from '@angular/platform-browser';
// NoopAnimationsModule (not BrowserAnimationsModule) — the federation config at
// federation.config.js skips '@angular/animations/browser' from the import map
// because of a known esbuild conditional-import resolution issue with that
// package. NoopAnimationsModule provides the AnimationsModule contract that
// MatDialog (S-014, D-355) requires without pulling in the browser animation
// engine. Modal behaviour is identical; transitions are instant.
import { NoopAnimationsModule }       from '@angular/platform-browser/animations';
import { HttpClientModule }          from '@angular/common/http';
import { ReactiveFormsModule }       from '@angular/forms';
import { IonicModule }               from '@ionic/angular';
import { AppRoutingModule }          from './app-routing.module';
import { AppComponent }              from './app.component';
import { LoginComponent }            from './features/login/login.component';
import { SidebarComponent }          from './shared/components/sidebar/sidebar.component';
import { BlockedActionComponent }    from './shared/components/blocked-action/blocked-action.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent
  ],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    BlockedActionComponent,     // standalone — imported, not declared
    LoginComponent              // standalone — imported, not declared
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
