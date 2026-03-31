// main.ts — Native Federation remote entry point
// Build A — Pathways OI Trust | Session 2026-03-29-A
// D-143: This app is a Native Federation REMOTE.
//   - Exposes: AppModule (see federation.config.js)
//   - Runs standalone at localhost:4201
//   - Loaded by the TRIARQ platform shell at merger time
//
// Two-file bootstrap pattern is required so that the federation runtime
// can intercept shared module negotiation before Angular bootstraps.

import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .catch((err) => console.error('[OI Trust] Federation init error:', err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error('[OI Trust] Bootstrap error:', err));
