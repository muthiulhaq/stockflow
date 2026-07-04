import { Component } from '@angular/core';
import { ProductListComponent } from './products/product-list/product-list';

@Component({
  selector: 'app-admin',
  imports: [ProductListComponent],
  standalone: true,
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent {

}
