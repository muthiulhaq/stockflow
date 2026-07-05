import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
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
    DatePickerModule,
    ButtonModule,
    SelectModule,
  ],
  templateUrl: './stock-list.html',
  styleUrl: './stock-list.css',
})
export class StockListComponent {
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

    const transaction = {
      product_id: formData.productId,
      type: formData.adjustmentType === 'IN' ? 'ADD' : 'REMOVE',
      quantity: formData.adjustmentType === 'IN' ? quantity : -quantity,
      reference_id: null,
      remarks: `${formData.reason}${formData.remarks ? ' - ' + formData.remarks : ''}`,
    };

    // Calculate new stock
    let newStock = 0;

    if (formData.adjustmentType === 'IN') {
      newStock = formData.currentStock + quantity;
    } else {
      newStock = formData.currentStock - quantity;

      if (newStock < 0) {
        alert('Stock cannot be negative.');
        return;
      }
    }

    // Save transaction
    this.stockService.addStockTransaction(transaction).subscribe({
      next: () => {
        // Update product stock
        this.stockService.updateProductStock(formData.productId, newStock).subscribe({
          next: () => {
            this.showAdjustmentDialog = false;

            this.loadStocks();
          },

          error: (err) => {
            console.error('Error updating stock:', err);
          },
        });
      },

      error: (err) => {
        console.error('Error saving transaction:', err);
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
    const transaction = {
      product_id: formData.productId,
      type: 'ADD' as const,
      quantity: formData.quantity,
      reference_id: formData.referenceNo || null,
      remarks: formData.remarks || null,
      name: product?.name || formData.productId, // Use product name if available, otherwise use productId
    };

    this.stockService.addStockTransaction(transaction).subscribe({
      next: () => {
        this.stockService.updateProductStock(formData.productId, formData.quantity).subscribe({
          next: () => {
            this.showAddStockDialog = false;
            this.loadStocks();
          },
          error: (err) => console.error('Error updating stock:', err),
        });
      },
      error: (err) => console.error('Error adding transaction:', err),
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

        // Map Supabase data to StockItem interface and populate products dropdown
        this.stocks = (data ?? []).map((item: any) => ({
          id: item.id,
          productName: item.name,
          currentStock: item.quantity || 0,
          lastUpdated: new Date(item.updated_at || item.created_at),
        }));

        // Populate products dropdown
        this.products = (data ?? []).map((item: any) => ({
          id: item.id,
          name: item.name,
        }));
      },

      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  loadProducts() {
    this.stockService.getActiveProducts().subscribe((data) => {
      this.products = (data.data ?? []).map((item: any) => ({
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
