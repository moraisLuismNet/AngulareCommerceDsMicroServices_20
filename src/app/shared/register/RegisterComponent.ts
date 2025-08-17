import { Component, afterNextRender, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// PrimeNG Modules
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { AppService } from 'src/app/services/AppService';

// Interfaces
import { IRegister } from 'src/app/interfaces/RegisterInterface';

@Component({
    selector: 'app-register',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ToastModule
    ],
    templateUrl: './RegisterComponent.html',
    styleUrls: ['./RegisterComponent.css'],
    providers: [MessageService]
})
export class RegisterComponent {
  usuario: IRegister = { email: '', password: '' };
  registrationError: string | null = null;

  private readonly appService = inject(AppService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  constructor() {
    // Use afterNextRender for one-time initialization after the component is created
    afterNextRender(() => {
      // Any one-time initialization code can go here
    });

    // Use afterNextRender for DOM-dependent operations
    afterNextRender(() => {
      // This will run after every change detection cycle
      // Can be used for DOM measurements or other operations that need the view to be stable
    });
  }

  onSubmit(form: any) {
    if (!form) return;
    
    if (form.valid) {
      this.appService.register(this.usuario).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Registration successful',
            detail: 'User successfully registered',
          });

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500); // Wait 1.5 seconds before redirecting
        },
        error: (err) => {
          console.error('Error registering user:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Registration error',
            detail: 'The user could not be registered. Please try again.',
          });
        },
      });
    }
  }
}
