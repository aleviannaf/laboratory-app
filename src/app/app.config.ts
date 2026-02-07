import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideEchartsCore } from 'ngx-echarts';
import { DialogModule } from '@angular/cdk/dialog';

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideEchartsCore({ echarts: () => import('echarts') }),
    importProvidersFrom(DialogModule)
  ],
};










