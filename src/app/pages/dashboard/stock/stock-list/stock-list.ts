import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { StockService } from '../../../../core/services/stock.service';

interface StockItem {
  id: number;
  productName: string;
  currentStock: number;
  lastUpdated: Date;
}

interface StockHistory {
  date: Date;
  transactionType: string;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  referenceNo: string;
  remarks: string;
}

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ReactiveFormsModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
  ],
  templateUrl: './stock-list.html',
  styleUrl: './stock-list.css',
})
export class StockListComponent implements OnInit {
  stocks: StockItem[] = [];
  stockForm!: FormGroup;
  adjustmentForm!: FormGroup;
  showAddStockDialog: boolean = false;
  showAdjustmentDialog = false;
  showHistoryDialog = false;

  loading = false;
  selectedProductName = '';

  stockHistory: StockHistory[] = [];

  products: any[] = [];

  adjustmentTypes = [
    { label: 'Increase', value: 'IN' },
    { label: 'Decrease', value: 'OUT' },
  ];

  adjustmentReasons = [
    { label: 'Damage', value: 'DAMAGE' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Lost', value: 'LOST' },
    { label: 'Found', value: 'FOUND' },
    { label: 'Stock Correction', value: 'CORRECTION' },
    { label: 'Other', value: 'OTHER' },
  ];

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
  ) {}

  ngOnInit(): void {
    this.loadStocks();
    this.initializeForm();
    this.initializeAdjustmentForm();
    this.loadProducts();
  }

  initializeForm(): void {
    this.stockForm = this.fb.group({
      productId: [null, Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
      unitCost: [0],
      date: [new Date(), Validators.required],
      referenceNo: [''],
      remarks: [''],
    });
  }

  initializeAdjustmentForm(): void {
    this.adjustmentForm = this.fb.group({
      productId: [null, Validators.required],
      currentStock: [{ value: 0, disabled: true }],
      adjustmentType: [null, Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
      reason: [null, Validators.required],
      transactionDate: [new Date(), Validators.required],
      remarks: [''],
    });
  }

  openAddStock(): void {
    this.showAddStockDialog = true;

    this.stockForm.reset({
      productId: null,
      quantity: null,
      unitCost: 0,
      date: new Date(),
      referenceNo: '',
      remarks: '',
    });
  }

  openAdjustmentDialog(stock: StockItem): void {
    this.showAdjustmentDialog = true;

    this.adjustmentForm.reset({
      productId: stock.id,
      currentStock: stock.currentStock,
      adjustmentType: null,
      quantity: null,
      reason: null,
      transactionDate: new Date(),
      remarks: '',
    });
  }

  saveAdjustment(): void {
    if (this.adjustmentForm.invalid) {
      this.adjustmentForm.markAllAsTouched();
      return;
    }

    const formData = this.adjustmentForm.getRawValue();
    const quantity = Number(formData.quantity);
    const delta = formData.adjustmentType === 'IN' ? quantity : -quantity;

    if (formData.adjustmentType === 'OUT' && formData.currentStock - quantity < 0) {
      alert('Stock cannot be negative.');
      return;
    }

    const product = this.products.find((p) => p.id === formData.productId);

    this.stockService.updateProductStock(formData.productId, delta, product?.name).subscribe({
      next: () => {
        this.showAdjustmentDialog = false;
        this.loadStocks();
      },
      error: (err) => {
        console.error('Error updating stock:', err);
        alert(err?.message || 'Failed to update stock.');
      },
    });
  }

  saveStock(): void {
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }

    const formData = this.stockForm.getRawValue();
    const product = this.products.find((p) => p.id === formData.productId);
    const quantity = Number(formData.quantity);

    this.stockService.updateProductStock(formData.productId, quantity, product?.name).subscribe({
      next: () => {
        this.showAddStockDialog = false;
        this.loadStocks();
      },
      error: (err) => {
        console.error('Error updating stock:', err);
        alert(err?.message || 'Failed to add stock.');
      },
    });
  }

  calculateNewStock(): number {
    const current = this.adjustmentForm.get('currentStock')?.value || 0;

    const qty = this.adjustmentForm.get('quantity')?.value || 0;

    const type = this.adjustmentForm.get('adjustmentType')?.value;

    if (type === 'IN') {
      return current + qty;
    }

    if (type === 'OUT') {
      return current - qty;
    }

    return current;
  }

  openHistoryDialog(stock: StockItem): void {
    this.selectedProductName = stock.productName;

    this.stockHistory = [];

    this.showHistoryDialog = true;
  }

  loadStocks(): void {
    this.loading = true;

    this.stockService.getStocks().subscribe({
      next: ({ data, error }) => {
        this.loading = false;

        if (error) {
          console.error(error);
          return;
        }

        this.stocks = this.mapStockRows(data ?? []);
      },

      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  /** One row per product; prefer earliest balance row for that product_id. */
  private mapStockRows(rows: any[]): StockItem[] {
    const byProduct = new Map<number, StockItem>();

    for (const item of rows) {
      const productId = item.product_id ?? item.id;
      if (productId == null || byProduct.has(productId)) {
        continue;
      }

      byProduct.set(productId, {
        id: productId,
        productName: item.name || `Product #${productId}`,
        currentStock: Number(item.quantity) || 0,
        lastUpdated: new Date(item.created_at),
      });
    }

    return Array.from(byProduct.values()).sort((a, b) =>
      (a.productName || '').localeCompare(b.productName || ''),
    );
  }

  loadProducts() {
    this.stockService.getActiveProducts().subscribe(({ data, error }) => {
      if (error) {
        console.error(error);
        return;
      }

      this.products = (data ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
    });
  }

  getStatus(stock: StockItem): string {
    if (stock.currentStock === 0) {
      return 'Out of Stock';
    }

    return 'In Stock';
  }
}
