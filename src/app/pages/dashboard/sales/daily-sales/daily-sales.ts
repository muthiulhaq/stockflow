import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SalesService } from '../../../../core/services/sales.service';
import { InvoiceComponent } from './invoice/invoice';

@Component({
  selector: 'app-daily-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    DatePickerModule,
    ToastModule,
    InvoiceComponent,
  ],
  templateUrl: './daily-sales.html',
  styleUrl: './daily-sales.css',
  providers: [MessageService],
})
export class DailySalesComponent implements OnInit {
  private salesService = inject(SalesService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  visible = false;
  loading = false;
  deletingId: number | null = null;

  selectedDate: Date = new Date();
  today: Date = new Date();
  selectedSale: any = null;
  sales: any[] = [];
  selectedSaleDetails: any[] = [];

  ngOnInit(): void {
    this.loadSales();
    this.salesService.salesChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadSales();
    });
  }

  get salesHeading(): string {
    return this.isSelectedToday() ? "Today's Sales" : `Sales — ${this.formatDisplayDate(this.selectedDate)}`;
  }

  get emptyMessage(): string {
    return this.isSelectedToday()
      ? 'No sales found today.'
      : `No sales found for ${this.formatDisplayDate(this.selectedDate)}.`;
  }

  onDateChange(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.loading = true;
    const dateStr = this.toLocalDateString(this.selectedDate);

    this.salesService.getTodaySales(dateStr).subscribe({
      next: ({ data, error }) => {
        this.loading = false;

        if (error) {
          console.error(error);
          return;
        }

        this.sales = (data ?? []).map((item: any) => {
          const saleItems = item.sale_items || [];
          const totalQuantity = saleItems.reduce(
            (sum: number, si: any) => sum + (si.quantity || 0),
            0,
          );
          return {
            id: item.id,
            invoiceNo: item.invoice_no,
            date: item.sale_date,
            time: new Date(item.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            itemCount: saleItems.length,
            quantity: totalQuantity,
            customer_name: item.customer_name,
            customer_phone: item.customer_phone,
            grandTotal: item.total,
            details: saleItems,
            notes: item.notes,
          };
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading sales:', err);
      },
    });
  }

  viewSale(sale: any): void {
    this.selectedSale = sale;
    this.visible = true;
    this.getSalesDetails(sale.id);
  }

  getSalesDetails(id: number): void {
    this.salesService.getSaleItemsBySaleId(id).subscribe({
      next: ({ data, error }) => {
        if (error) {
          console.error('daaaata', error);
          return;
        }
        this.selectedSaleDetails = data;
      },
    });
  }

  printBill(id: number): void {
    window.open(`/invoice/${id}`, '_blank');
  }

  deleteSale(sale: any, event?: Event): void {
    event?.stopPropagation();

    if (!confirm(`Delete invoice ${sale.invoiceNo}? Stock will be restored.`)) {
      return;
    }

    this.deletingId = sale.id;

    this.salesService.deleteSale(sale.id).subscribe({
      next: () => {
        this.deletingId = null;
        if (this.selectedSale?.id === sale.id) {
          this.visible = false;
          this.selectedSale = null;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `${sale.invoiceNo} deleted and stock restored`,
        });
      },
      error: (err) => {
        this.deletingId = null;
        console.error('Error deleting sale:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete sale',
        });
      },
    });
  }

  private isSelectedToday(): boolean {
    return this.toLocalDateString(this.selectedDate) === this.toLocalDateString(new Date());
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
