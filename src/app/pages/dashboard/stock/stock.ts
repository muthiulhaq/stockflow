import { Component } from '@angular/core';
import { StockListComponent } from './stock-list/stock-list';

@Component({
  selector: 'app-stock',
  imports: [StockListComponent],
  templateUrl: './stock.html',
  styleUrl: './stock.css',
})
export class StockComponent {

}
