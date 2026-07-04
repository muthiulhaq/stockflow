import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';

interface Purchase {
  id: number;
  purchaseNo: string;
  supplierName: string;
  purchaseDate: Date;
  totalAmount: number;
  itemCount: number;
  status: 'Pending' | 'Completed';
}

interface PurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
  amount: number;
}

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    TagModule,
    CurrencyPipe,
    DatePipe,
    FormsModule
  ],
  templateUrl: './purchase-list.html',
  styleUrl: './purchase-list.css'
})
export class PurchaseListComponent {

  purchaseForm!: FormGroup;

  purchases: Purchase[] = [];

  showPurchaseDialog = false;

  suppliers = [
    { id: 1, name: 'ABC Suppliers' },
    { id: 2, name: 'XYZ Traders' },
    { id: 3, name: 'Global Foods' }
  ];

  products = [
    { id: 1, name: 'Rice' },
    { id: 2, name: 'Sugar' },
    { id: 3, name: 'Oil' }
  ];

  selectedProductId: number | null = null;

  itemQty = 1;

  itemCostPrice = 0;

  purchaseItems: PurchaseItem[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPurchases();
  }

  initializeForm(): void {
    this.purchaseForm = this.fb.group({
      purchaseNo: [''],
      supplierId: [null, Validators.required],
      purchaseDate: [new Date(), Validators.required],
      invoiceNo: [''],
      remarks: ['']
    });
  }

  loadPurchases(): void {
    this.purchases = [
      {
        id: 1,
        purchaseNo: 'PO-1001',
        supplierName: 'ABC Suppliers',
        purchaseDate: new Date(),
        totalAmount: 5000,
        itemCount: 3,
        status: 'Completed'
      },
      {
        id: 2,
        purchaseNo: 'PO-1002',
        supplierName: 'XYZ Traders',
        purchaseDate: new Date(),
        totalAmount: 2500,
        itemCount: 2,
        status: 'Pending'
      }
    ];
  }

  openPurchaseDialog(): void {

    this.showPurchaseDialog = true;

    this.purchaseItems = [];

    this.selectedProductId = null;
    this.itemQty = 1;
    this.itemCostPrice = 0;

    this.purchaseForm.reset({
      purchaseNo: 'PO-' + Date.now(),
      supplierId: null,
      purchaseDate: new Date(),
      invoiceNo: '',
      remarks: ''
    });
  }

  addItem(): void {

    if (!this.selectedProductId) {
      return;
    }

    const product = this.products.find(
      x => x.id === this.selectedProductId
    );

    if (!product) {
      return;
    }

    const item: PurchaseItem = {
      productId: product.id,
      productName: product.name,
      quantity: this.itemQty,
      costPrice: this.itemCostPrice,
      amount: this.itemQty * this.itemCostPrice
    };

    this.purchaseItems.push(item);

    this.selectedProductId = null;
    this.itemQty = 1;
    this.itemCostPrice = 0;
  }

  removeItem(index: number): void {
    this.purchaseItems.splice(index, 1);
  }

  getTotalQuantity(): number {

    return this.purchaseItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }

  getGrandTotal(): number {

    return this.purchaseItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
  }

  savePurchase(): void {

    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    if (this.purchaseItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const payload = {
      ...this.purchaseForm.getRawValue(),
      items: this.purchaseItems,
      totalQty: this.getTotalQuantity(),
      grandTotal: this.getGrandTotal()
    };

    console.log('Purchase Payload', payload);

    /**
     * API Call Here
     *
     * Save Purchase Header
     * Save Purchase Items
     * Update Product Stock
     * Add Stock Transaction
     */

    this.showPurchaseDialog = false;

    this.loadPurchases();
  }

  clearForm(): void {

    this.purchaseItems = [];

    this.purchaseForm.reset({
      purchaseNo: 'PO-' + Date.now(),
      supplierId: null,
      purchaseDate: new Date(),
      invoiceNo: '',
      remarks: ''
    });
  }

  getSeverity(status: string):
    'success' | 'warn' | 'danger' {

    switch (status) {

      case 'Completed':
        return 'success';

      case 'Pending':
        return 'warn';

      default:
        return 'danger';
    }
  }

  editPurchase(purchase: Purchase): void {

  this.showPurchaseDialog = true;

  console.log('Edit Purchase', purchase);

  // Later load purchase details here
}

}