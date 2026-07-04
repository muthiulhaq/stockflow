import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-daily-sales',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, DialogModule],
  templateUrl: './daily-sales.html',
  styleUrl: './daily-sales.css',
})
export class DailySalesComponent {
  visible = false;

  selectedSale: any = null;
  sales = [
    {
      invoiceNo: 'INV001',
      time: '10:15 AM',
      customerName: 'Rahman',
      itemCount: 3,
      quantity: 7,
      grandTotal: 1250,
    },
    {
      invoiceNo: 'INV002',
      time: '11:20 AM',
      customerName: 'Ashraf',
      itemCount: 2,
      quantity: 4,
      grandTotal: 850,
    },
    {
      invoiceNo: 'INV003',
      time: '01:45 PM',
      customerName: 'Sameer',
      itemCount: 5,
      quantity: 12,
      grandTotal: 2100,
    },
  ];

viewSale(sale: any): void {
  this.selectedSale = sale;
  this.visible = true;
}
}
