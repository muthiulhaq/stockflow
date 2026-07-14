import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { SalesService } from '../../../../core/services/sales.service';
import { StockService } from '../../../../core/services/stock.service';

@Component({
  selector: 'app-sales-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    CardModule,
    SelectModule,
    ToastModule,
  ],
  templateUrl: './sales-form.html',
  styleUrl: './sales-form.css',
  providers: [MessageService],
})
export class SalesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salesService = inject(SalesService);
  private stockService = inject(StockService);
  private messageService = inject(MessageService);

  products: any[] = [];
  loading = false;
  availableStocks: number[] = [];

  salesForm = this.fb.group({
    customerName: ['', Validators.required],
    customerPhone: [''],
    notes: [''],
    items: this.fb.array([this.createItem()]),
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  createItem(): FormGroup {
    return this.fb.group({
      productId: [null, Validators.required],
      itemName: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
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
    return this.items.controls.reduce((sum, _, index) => sum + this.getSubtotal(index), 0);
  }

  loadProducts(): void {
    this.salesService.getProducts().subscribe({
      next: ({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }

        this.products = (data ?? []).map((item: any) => ({
          id: item.id,
          name: item.name,
          selling_price: item.selling_price,
          stock: item.stock_transactions?.[0]?.quantity ?? 0,
        }));
        console.log('Products:', this.products);
      },
      error: (err) => console.error(err),
    });
  }

onProductChange(event: any, index: number): void {
  const productId = event.value;

  console.log('Selected:', productId);

  const item = this.items.at(index);
  const product = this.products.find(p => p.id == productId);

  if (product) {
    item.patchValue({
      itemName: product.name,
      unitPrice: product.selling_price
    });

    this.availableStocks[index] = product.stock;
  }
}

  async saveSale(): Promise<void> {
    if (this.salesForm.invalid) {
      this.salesForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all required fields',
      });
      return;
    }

    this.loading = true;

    try {
      // Generate invoice number
      const invoiceNo = await this.salesService.generateInvoiceNo();

      const formData = this.salesForm.getRawValue();
      const today = new Date().toISOString().split('T')[0];

      // Create sale object
      const sale = {
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone || null,
        invoice_no: invoiceNo,
        sale_date: today,
        subtotal: this.grandTotal,
        discount: 0,
        total: this.grandTotal,
        notes: formData.notes || null,
      };

      // Save sale and get ID
      this.salesService.saveSale(sale).subscribe({
        next: async (response: any) => {
          const saleId = response.data.id;

          // Prepare sale items
          const saleItems = formData.items.map((item: any) => ({
            sale_id: saleId,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
            total: item.quantity * item.unitPrice,
          }));

          // Save sale items
          this.salesService.saveSaleItems(saleItems).subscribe({
            next: () => {
              // Update stock for each item
              this.updateStockForItems(saleItems);
            },
            error: (err) => {
              this.loading = false;
              this.availableStocks = []
              console.error('Error saving items:', err);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to save sale items',
              });
            },
          });
        },
        error: (err) => {
          this.loading = false;
          this.availableStocks = []
          console.error('Error saving sale:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save sale',
          });
        },
      });
    } catch (err) {
      this.loading = false;
      this.availableStocks = []
      console.error('Error:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate invoice number',
      });
    }
  }

  private updateStockForItems(items: any[]): void {
    let completed = 0;

    items.forEach((item) => {
      this.stockService.updateProductStock(item.product_id, -item.quantity).subscribe({
        next: () => {
          completed++;
          if (completed === items.length) {
            this.loading = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Sale saved successfully',
            });
            this.resetForm();
          }
        },
        error: (err) => {
          console.error('Error updating stock:', err);
          completed++;
          if (completed === items.length) {
            this.loading = false;
            this.messageService.add({
              severity: 'warn',
              summary: 'Partial Success',
              detail: 'Sale saved but some stock updates failed',
            });
          }
        },
      });
    });
  }

  private resetForm(): void {
    this.salesForm.reset({
      customerName: '',
      customerPhone: '',
      notes: '',
      items: [this.createItem()],
    });
    this.items.clear();
    this.items.push(this.createItem());
  }
}
