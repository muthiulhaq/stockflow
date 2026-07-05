import { Component } from '@angular/core';
import { SalesFormComponent } from './sales-form/sales-form';
import { DailySalesComponent } from './daily-sales/daily-sales';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [SalesFormComponent, DailySalesComponent],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class SalesComponent {

}
