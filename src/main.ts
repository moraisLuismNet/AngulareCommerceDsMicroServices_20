import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AppComponent } from './app/AppComponent';
import { routes } from './app/AppRoutes';
import { AuthGuard } from './app/guards/AuthGuardService';
import { authInterceptor } from './app/interceptors/AuthInterceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimations(),
    provideAnimationsAsync(),
    ConfirmationService,
    MessageService,
    AuthGuard,
  ]
}).catch(err => console.error(err));
