// bootstrap.ts — Angular NgModule bootstrap
// Separate from main.ts to support the Native Federation two-file pattern.
// The federation runtime loads shared modules before this file runs.

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule }              from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error('[OI Trust] Module bootstrap error:', err));
