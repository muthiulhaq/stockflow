import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { SalesService } from '../../../core/services/sales.service';
import {
  PAYMENT_METHODS,
  PaymentMethod,
  normalizePaymentMethod,
} from '../../../core/models/payment-method';

interface ReportSale {
  id: number;
  invoiceNo: string;
  saleDate: string;
  time: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  quantity: number;
  discount: number;
  grandTotal: number;
  notes?: string;
  paymentMethod: PaymentMethod;
}

interface PaymentBreakdown {
  method: PaymentMethod;
  total: number;
  invoiceCount: number;
}

interface TopProduct {
  productId: number;
  name: string;
  code: string;
  quantity: number;
  revenue: number;
}

interface DailyTrend {
  date: string;
  label: string;
  total: number;
  invoiceCount: number;
  heightPct: number;
}

interface ReportSummary {
  invoiceCount: number;
  revenue: number;
  profit: number;
  itemsSold: number;
  avgTicket: number;
  discountTotal: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class ReportsComponent implements OnInit {
  loading = false;

  fromDate: Date = this.startOfDay(this.daysAgo(6));
  toDate: Date = this.startOfDay(new Date());

  sales: ReportSale[] = [];
  topProducts: TopProduct[] = [];
  dailyTrend: DailyTrend[] = [];
  paymentBreakdown: PaymentBreakdown[] = this.emptyPaymentBreakdown();
  summary: ReportSummary = {
    invoiceCount: 0,
    revenue: 0,
    profit: 0,
    itemsSold: 0,
    avgTicket: 0,
    discountTotal: 0,
  };

  constructor(private salesService: SalesService) {}

  ngOnInit(): void {
    this.loadReport();
  }

  applyPreset(days: number): void {
    this.toDate = this.startOfDay(new Date());
    this.fromDate = this.startOfDay(this.daysAgo(days - 1));
    this.loadReport();
  }

  dayTooltip(day: DailyTrend): string {
    const total = Math.round(day.total).toLocaleString('en-IN');
    return `₹ ${total} · ${day.invoiceCount} invoices`;
  }

  loadReport(): void {
    if (!this.fromDate || !this.toDate) {
      return;
    }

    const from = this.toDateString(this.fromDate);
    const to = this.toDateString(this.toDate);

    if (from > to) {
      return;
    }

    this.loading = true;

    this.salesService.getSalesByDateRange(from, to).subscribe({
      next: ({ data, error }) => {
        this.loading = false;

        if (error) {
          console.error(error);
          this.resetReport();
          return;
        }

        this.buildReport(data ?? [], from, to);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading report:', err);
        this.resetReport();
      },
    });
  }

  private buildReport(rows: any[], from: string, to: string): void {
    const productMap = new Map<number, TopProduct>();
    const dailyMap = new Map<string, { total: number; invoiceCount: number }>();
    const paymentMap = new Map<PaymentMethod, PaymentBreakdown>(
      PAYMENT_METHODS.map((method) => [method, { method, total: 0, invoiceCount: 0 }]),
    );

    let revenue = 0;
    let profit = 0;
    let itemsSold = 0;
    let discountTotal = 0;

    this.sales = rows.map((item: any) => {
      const saleItems = item.sale_items || [];
      const quantity = saleItems.reduce(
        (sum: number, si: any) => sum + (si.quantity || 0),
        0,
      );

      revenue += Number(item.total) || 0;
      discountTotal += Number(item.discount) || 0;
      itemsSold += quantity;

      const costOfGoods = saleItems.reduce((sum: number, si: any) => {
        const qty = Number(si.quantity) || 0;
        const cost = Number(si.products?.cost_price) || 0;
        return sum + qty * cost;
      }, 0);
      profit += (Number(item.total) || 0) - costOfGoods;

      const dayKey = item.sale_date;
      const dayEntry = dailyMap.get(dayKey) ?? { total: 0, invoiceCount: 0 };
      dayEntry.total += Number(item.total) || 0;
      dayEntry.invoiceCount += 1;
      dailyMap.set(dayKey, dayEntry);

      for (const si of saleItems) {
        const product = si.products;
        const productId = si.product_id ?? product?.id;
        if (!productId) {
          continue;
        }

        const existing = productMap.get(productId) ?? {
          productId,
          name: product?.name ?? 'Unknown',
          code: product?.code ?? '—',
          quantity: 0,
          revenue: 0,
        };

        existing.quantity += Number(si.quantity) || 0;
        existing.revenue += Number(si.total) || 0;
        productMap.set(productId, existing);
      }

      const paymentMethod = normalizePaymentMethod(item.payment_method);
      const paymentEntry = paymentMap.get(paymentMethod);
      if (paymentEntry) {
        paymentEntry.total += Number(item.total) || 0;
        paymentEntry.invoiceCount += 1;
      }

      return {
        id: item.id,
        invoiceNo: item.invoice_no,
        saleDate: item.sale_date,
        time: new Date(item.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        customerName: item.customer_name || 'Walk-in',
        customerPhone: item.customer_phone || '—',
        itemCount: saleItems.length,
        quantity,
        discount: Number(item.discount) || 0,
        grandTotal: Number(item.total) || 0,
        notes: item.notes,
        paymentMethod,
      };
    });

    const invoiceCount = this.sales.length;

    this.summary = {
      invoiceCount,
      revenue,
      profit,
      itemsSold,
      avgTicket: invoiceCount ? revenue / invoiceCount : 0,
      discountTotal,
    };

    this.topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    this.paymentBreakdown = PAYMENT_METHODS.map(
      (method) => paymentMap.get(method) ?? { method, total: 0, invoiceCount: 0 },
    );

    this.dailyTrend = this.buildDailyTrend(from, to, dailyMap);
  }

  private buildDailyTrend(
    from: string,
    to: string,
    dailyMap: Map<string, { total: number; invoiceCount: number }>,
  ): DailyTrend[] {
    const days: DailyTrend[] = [];
    const cursor = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);

    while (cursor <= end) {
      const key = this.toDateString(cursor);
      const entry = dailyMap.get(key) ?? { total: 0, invoiceCount: 0 };
      days.push({
        date: key,
        label: cursor.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
        }),
        total: entry.total,
        invoiceCount: entry.invoiceCount,
        heightPct: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const max = Math.max(...days.map((d) => d.total), 0);
    return days.map((d) => ({
      ...d,
      heightPct: max > 0 ? Math.max((d.total / max) * 100, d.total > 0 ? 8 : 0) : 0,
    }));
  }

  private resetReport(): void {
    this.sales = [];
    this.topProducts = [];
    this.dailyTrend = [];
    this.paymentBreakdown = this.emptyPaymentBreakdown();
    this.summary = {
      invoiceCount: 0,
      revenue: 0,
      profit: 0,
      itemsSold: 0,
      avgTicket: 0,
      discountTotal: 0,
    };
  }

  private emptyPaymentBreakdown(): PaymentBreakdown[] {
    return PAYMENT_METHODS.map((method) => ({ method, total: 0, invoiceCount: 0 }));
  }

  private daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
