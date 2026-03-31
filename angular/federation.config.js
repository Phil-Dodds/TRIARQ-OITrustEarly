// federation.config.js — Native Federation remote configuration
// Build A — Pathways OI Trust | D-143
//
// This app is a REMOTE in the TRIARQ platform shell.
// At merger time, the shell loads this remote via the remoteEntry generated here.
// The app also runs fully standalone (localhost:4201).
//
// To initialise after running: ng add @angular-architects/native-federation
// The schematic writes the manifest; this file controls what is exposed.

const { withNativeFederation, shareAll } =
  require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({

  name: 'pathways-oi-trust',

  // D-143: Exposed module — AppModule is the integration point for the shell.
  exposes: {
    './AppModule': './src/app/app.module.ts'
  },

  // Share all Angular + Ionic packages as singletons.
  // strictVersion prevents version mismatches between shell and remote at load time.
  shared: {
    ...shareAll({
      singleton:       true,
      strictVersion:   true,
      requiredVersion: 'auto'
    })
  },

  // Skip packages that cause Native Federation bundler errors.
  // Ionic/Stencil use conditional Node.js imports that esbuild can't resolve
  // in a browser-only build context. RxJS sub-paths inflate the shared chunk.
  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    '@angular/animations/browser',
    '@stencil/core',
    '@ionic/core',
    '@ionic/angular',
    '@ionic/angular/standalone',
    'ionicons',
    'ionicons/icons'
  ]
});
