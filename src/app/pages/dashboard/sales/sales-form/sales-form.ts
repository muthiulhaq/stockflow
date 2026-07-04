import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-sales-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    CardModule
  ],
  templateUrl: './sales-form.html',
  styleUrl: './sales-form.css'
})
export class SalesFormComponent {
  private fb = inject(FormBuilder);

  salesForm = this.fb.group({
    customerName: ['', Validators.required],
    customerPhone: [''],
    notes: [''],
    items: this.fb.array([this.createItem()])
  });

  createItem(): FormGroup {
    return this.fb.group({
      itemName: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  get items(): FormArray {
    return this.salesForm.get('items') as FormArray;
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  getSubtotal(index: number): number {
    const row = this.items.at(index);

    const qty = Number(row.get('quantity')?.value ?? 0);
    const price = Number(row.get('unitPrice')?.value ?? 0);

    return qty * price;
  }

  get grandTotal(): number {
    return this.items.controls.reduce(
      (sum, _, index) => sum + this.getSubtotal(index),
      0
    );
  }

  saveSale(): void {
    if (this.salesForm.invalid) {
      this.salesForm.markAllAsTouched();
      return;
    }

    console.log(this.salesForm.getRawValue());

    alert('Sale Saved Successfully');
  }
}