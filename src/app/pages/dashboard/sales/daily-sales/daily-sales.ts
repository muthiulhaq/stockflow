import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SalesService } from '../../../../core/services/sales.service';


@Component({
  selector: 'app-daily-sales',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, DialogModule],
  templateUrl: './daily-sales.html',
  styleUrl: './daily-sales.css',
})
export class DailySalesComponent implements OnInit {
  visible = false;
  loading = false;

  selectedSale: any = null;
  sales: any[] = [];

  constructor(private salesService: SalesService) {}

  ngOnInit(): void {
    this.loadTodaySales();
  }

  loadTodaySales(): void {
    this.loading = true;

    this.salesService.getTodaySales().subscribe({
      next: ({ data, error }) => {
        this.loading = false;

        if (error) {
          console.error(error);
          return;
        }

        // Map Supabase data to component format
        this.sales = (data ?? []).map((item: any) => {
          const saleItems = item.sale_items || [];
          const totalQuantity = saleItems.reduce(
            (sum: number, si: any) => sum + (si.quantity || 0),
            0
          );
debugger
          return {
            id: item.id,
            invoiceNo: item.invoice_no,
            time: new Date(item.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            itemCount: saleItems.length,
            quantity: totalQuantity,
            customer_name: item.customer_name,
            customer_phone: item.customer_phone,
            grandTotal: item.total,
            details: saleItems
          };
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading sales:', err);
      }
    });
  }

  viewSale(sale: any): void {
    this.selectedSale = sale;
    this.visible = true;
  }
}
