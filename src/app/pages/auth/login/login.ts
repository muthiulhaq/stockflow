import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  loading = false;

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [true],
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  async ngOnInit() {
    const { data } = await this.authService.getSession();

    if (data.session) {
      this.router.navigate(['/sales']);
    }
  }
  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const { email, password } = this.loginForm.value;

    const { error } = await this.authService.login(email, password);

    this.loading = false;

    if (error) {
      alert(error.message);
      return;
    }

    this.router.navigate(['/sales']);
  }
}
