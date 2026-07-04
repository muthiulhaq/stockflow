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
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
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

  products = [
    { id: 1, name: 'Rice' },
    { id: 2, name: 'Sugar' },
    { id: 3, name: 'Oil' },
  ];

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
    private stockService: StockService
  ) {}

ngOnInit(): void {
  this.loadStocks();
  this.initializeForm();
  this.initializeAdjustmentForm();
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

    const payload = this.adjustmentForm.getRawValue();

    console.log(payload);

    /*
    API:
    POST /stock-adjustment

    {
      productId,
      adjustmentType,
      quantity,
      reason,
      transactionDate,
      remarks
    }
  */

    this.showAdjustmentDialog = false;

    this.loadStocks();
  }

  saveStock(): void {
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }

    const payload = this.stockForm.getRawValue();

    console.log(payload);

    // API Call

    this.showAddStockDialog = false;

    this.loadStocks();
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
debugger;
        // Map Supabase data to StockItem interface
        this.stocks = (data ?? []).map((item: any) => ({
          id: item.id,
          productCode: item.code || '-',
          productName: item.name,
          category: item.category || '-',
          currentStock: item.current_stock || 0,
          unit: item.unit || 'KG',
          reorderLevel: item.minimum_stock || 0,
          costPrice: item.cost_price || 0,
          sellingPrice: item.selling_price || 0,
          lastUpdated: new Date(item.updated_at || item.created_at),
        }));
      },

      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  getStockValue(stock: StockItem): number {
    return stock.currentStock * stock.costPrice;
  }

  getSeverity(stock: StockItem): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    if (stock.currentStock === 0) {
      return 'danger';
    }

    if (stock.currentStock <= stock.reorderLevel) {
      return 'warn';
    }

    return 'success';
  }

  getStatus(stock: StockItem): string {
    if (stock.currentStock === 0) {
      return 'Out of Stock';
    }

    if (stock.currentStock <= stock.reorderLevel) {
      return 'Low Stock';
    }

    return 'In Stock';
  }
}
