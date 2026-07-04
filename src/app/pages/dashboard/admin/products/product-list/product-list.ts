import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';

import { ProductService } from '../../../../../core/services/product.service';
import { Product } from '../../../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CurrencyPipe,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    TagModule,
  ],
})
export class ProductListComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {}

  products: Product[] = [];
  filteredProducts: Product[] = [];

  loading = false;

  productDialog = false;

  editing = false;

  selectedProductId = 0;

  searchText = '';

  productForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.loadProducts();
  }

  initializeForm() {
    this.productForm = this.fb.group({
      code: [''],
      name: ['', Validators.required],
      cost_price: [0, Validators.required],
      selling_price: [0, Validators.required],
      active: [true],
    });
  }

  loadProducts() {
    this.loading = true;

    this.productService.getProducts().subscribe({
      next: ({ data, error }) => {
        this.loading = false;

        if (error) {
          console.error(error);
          return;
        }

        this.products = data ?? [];
        this.filteredProducts = [...this.products];
      },

      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  openNew() {
    this.editing = false;
    this.selectedProductId = 0;

    this.productForm.reset({
      code: '',
      name: '',
      cost_price: 0,
      selling_price: 0,
      active: true,
    });

    this.productDialog = true;
  }

  editProduct(product: Product) {
    this.editing = true;
    this.selectedProductId = product.id;

    this.productForm.patchValue(product);

    this.productDialog = true;
  }

  saveProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    if (this.editing) {
      this.productService
        .updateProduct(this.selectedProductId, this.productForm.value)
        .subscribe({
          next: () => {
            this.productDialog = false;
            this.loadProducts();
          },

          error: (err) => console.error(err),
        });
    } else {
      this.productService.addProduct(this.productForm.value).subscribe({
        next: () => {
          this.productDialog = false;
          this.loadProducts();
        },

        error: (err) => console.error(err),
      });
    }
  }

  deleteProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) {
      return;
    }

    this.productService.deleteProduct(product.id).subscribe({
      next: () => this.loadProducts(),
      error: (err) => console.error(err),
    });
  }

  search() {
    const keyword = this.searchText.trim().toLowerCase();

    if (!keyword) {
      this.filteredProducts = [...this.products];
      return;
    }

    this.filteredProducts = this.products.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        (p.code ?? '').toLowerCase().includes(keyword)
    );
  }

  getStatus(product: Product) {
    return product.active ? 'Active' : 'Inactive';
  }

  getSeverity(product: Product): 'success' | 'danger' {
    return product.active ? 'success' : 'danger';
  }
}