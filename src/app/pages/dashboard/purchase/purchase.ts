import { Component } from '@angular/core';
import { PurchaseListComponent } from './purchase-list/purchase-list';

@Component({
  selector: 'app-purchase',
  imports: [PurchaseListComponent],
  templateUrl: './purchase.html',
  styleUrl: './purchase.css',
})
export class PurchaseComponent {

}
