import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { PAYMENT_METHOD_OPTIONS } from '../../../../core/models/payment-method';

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
  private destroyRef = inject(DestroyRef);

  products: any[] = [];
  loading = false;
  availableStocks: number[] = [];
  paymentMethods = PAYMENT_METHOD_OPTIONS;
  private nextItemRowId = 0;

  salesForm = this.fb.group({
    customerName: [''],
    customerPhone: [''],
    paymentMethod: ['Cash', Validators.required],
    notes: [''],
    items: this.fb.array([this.createItem()]),
  });

  ngOnInit(): void {
    this.loadProducts();
    this.salesService.salesChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadProducts();
    });
  }

  createItem(): FormGroup {
    const group = this.fb.group({
      rowId: [this.nextItemRowId++],
      productId: [null, Validators.required],
      itemName: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    });

    group
      .get('productId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((productId) => {
        this.fillItemFromProduct(group, productId);
      });

    return group;
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
    this.fillItemFromProduct(this.items.at(index) as FormGroup, event.value, index);
  }

  private fillItemFromProduct(item: FormGroup, productId: unknown, index?: number): void {
    const rowIndex = index ?? this.items.controls.indexOf(item);
    const product = this.products.find((p) => p.id == productId);

    if (!product) {
      item.patchValue(
        {
          itemName: '',
          quantity: 1,
          unitPrice: 0,
        },
        { emitEvent: false },
      );
      if (rowIndex >= 0) {
        this.availableStocks[rowIndex] = 0;
      }
      return;
    }

    item.patchValue(
      {
        itemName: product.name,
        unitPrice: product.selling_price,
      },
      { emitEvent: false },
    );
    item.get('quantity')?.setValue(1, { emitEvent: false });

    if (rowIndex >= 0) {
      this.availableStocks[rowIndex] = product.stock;
    }
  }

  async saveSale(): Promise<void> {
    if (this.items.length === 0 || this.items.invalid) {
      this.items.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Add at least one item with product, quantity, and price',
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
        customer_name: formData.customerName?.trim() || 'Unknow customer',
        customer_phone: formData.customerPhone?.trim() || 'Unknow phone number',
        invoice_no: invoiceNo,
        sale_date: today,
        subtotal: this.grandTotal,
        discount: 0,
        total: this.grandTotal,
        notes: formData.notes || null,
        payment_method: formData.paymentMethod || 'Cash',
      };

      // Save sale and get ID
      this.salesService.saveSale(sale).subscribe({
        next: async (response: any) => {
          if (response.error) {
            this.loading = false;
            this.availableStocks = [];
            console.error('Error saving sale:', response.error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.saleSaveErrorDetail(response.error),
            });
            return;
          }

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
              this.salesService.notifySalesChanged();
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
            detail: this.saleSaveErrorDetail(err),
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
            this.loadProducts();
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

  private saleSaveErrorDetail(err: any): string {
    const message = String(err?.message ?? err ?? '');
    if (err?.code === '42703' || message.includes('payment_method')) {
      return 'Add the payment_method column to the sales table in Supabase, then try again';
    }
    return 'Failed to save sale';
  }

  private resetForm(): void {
    this.salesForm.patchValue({
      customerName: '',
      customerPhone: '',
      paymentMethod: 'Cash',
      notes: '',
    });
    this.items.clear();
    this.items.push(this.createItem());
    this.availableStocks = [];
    this.salesForm.markAsPristine();
    this.salesForm.markAsUntouched();
  }
}
