import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { StockflowPreset } from './core/theme/stockflow-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: StockflowPreset,
        options: {
          // Opt out of the OS dark-mode default: the brand is white-surfaced,
          // dark only applies when `.app-dark` is put on <html>.
          darkModeSelector: '.app-dark'
        }
      }
    })
  ]
};
