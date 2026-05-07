// app.module.ts — Pathways OI Trust
// Native Federation remote — exposed module: AppModule (D-143).
// Feature modules are lazy-loaded. No eagerly imported feature code here.
// Zero Supabase client imports — auth is in AuthService only.

import { NgModule }                  from '@angular/core';
import { BrowserModule }             from '@angular/platform-browser';
import { BrowserAnimationsModule }   from '@angular/platform-browser/animations';
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
    // Required by @angular/material — MatDialog uses Angular animations (S-014, D-355).
    BrowserAnimationsModule,
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
