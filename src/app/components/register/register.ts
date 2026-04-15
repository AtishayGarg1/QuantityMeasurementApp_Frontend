import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
       ? null : {'mismatch': true};
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      const { email, password } = this.registerForm.value;
      this.authService.register({ email, password }).subscribe({
        next: () => {
          this.successMessage = 'Registration successful! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          if (err.status === 0) {
            this.errorMessage = 'Cannot reach the server. Is the backend running?';
          } else {
            // Backend returns { Status, Message } — check both casings
            this.errorMessage = err.error?.Message || err.error?.message || 'Registration failed. Please try again.';
          }
          this.loading = false;
        }
      });
    }
  }
}
