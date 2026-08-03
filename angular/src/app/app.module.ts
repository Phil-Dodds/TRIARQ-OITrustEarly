// app.module.ts — Pathways OI Trust
// Native Federation remote — exposed module: AppModule (D-143).
// Feature modules are lazy-loaded. No eagerly imported feature code here.
// Zero Supabase client imports — auth is in AuthService only.

import { NgModule, APP_INITIALIZER } from '@angular/core';
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
import { Router }                    from '@angular/router';
import { AppRoutingModule }          from './app-routing.module';
import { AppComponent }              from './app.component';
import { LoginComponent }            from './features/login/login.component';
import { SidebarComponent }          from './shared/components/sidebar/sidebar.component';
import { BlockedActionComponent }    from './shared/components/blocked-action/blocked-action.component';
import { AboutPanelComponent }       from './shared/components/about-panel/about-panel.component';
import { EggCelebrationOverlayComponent } from './features/easter-eggs/egg-celebration-overlay.component';
import { EggIconComponent }            from './features/easter-eggs/egg-icon.component';
import { NewsBannerComponent }         from './features/news-banner/news-banner.component';
import { MaintenanceScreenComponent }  from './features/maintenance/maintenance-screen.component';
import { MaintenanceModeService }      from './core/services/maintenance-mode.service';

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
    LoginComponent,             // standalone — imported, not declared
    AboutPanelComponent,        // standalone — D-426 About Panel
    EggCelebrationOverlayComponent, // standalone — Easter Egg Hunt completion overlay
    EggIconComponent,           // standalone — sidebar dancing-egg teaser (zero-egg users)
    NewsBannerComponent,        // standalone — bottom news banner
    MaintenanceScreenComponent  // standalone — AC-29 maintenance screen
  ],
  providers: [
    // AC-29 (D-MaintenanceMode): resolve the maintenance flag BEFORE the router
    // performs its initial navigation. APP_INITIALIZER is the only hook that
    // runs early enough — a route guard would already have resolved a route,
    // and an ngOnInit read would flash the app shell first. The service
    // fail-opens, so a slow or failed read never blocks bootstrap.
    //
    // When the flag is on, the route table is replaced with a single
    // child-less wildcard before initial navigation. That is what "suppresses
    // all routing" has to mean in practice: hiding <router-outlet> alone would
    // still let the router match a route, run AuthGuard, and lazy-load a
    // feature module — i.e. attempt auth, which build-c-spec §5.2 forbids.
    // A wildcard that matches everything and resolves to nothing runs no guard
    // and loads no module.
    {
      provide:    APP_INITIALIZER,
      multi:      true,
      deps:       [MaintenanceModeService, Router],
      useFactory: (maintenance: MaintenanceModeService, router: Router) =>
        async () => {
          const state = await maintenance.resolveMaintenanceModeAtBootstrap();
          if (state.active) {
            router.resetConfig([{ path: '**', children: [] }]);
          }
        }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
