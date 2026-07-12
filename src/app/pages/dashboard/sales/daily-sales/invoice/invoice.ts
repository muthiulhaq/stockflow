import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../../../../core/services/sales.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice.html',
  styleUrl: './invoice.css',
})
export class InvoiceComponent implements OnInit, AfterViewInit {

  sales: any = null;
  loading = true;
  saleDetailInfo: any = null;

  constructor(
    private route: ActivatedRoute,
    private salesService: SalesService
  ) {}

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.loadSale(id);
    }

  }

  loadSale(id: number) {

    this.salesService.getSaleById(id).subscribe({

      next: ({ data, error }) => {
debugger
        if (error) {
          console.error(error);
          return;
        }

        this.sales = data;
        this.loading = false;

      },

      error: (err) => {
        console.error(err);
      }

    });

  }

  ngAfterViewInit(): void {

    const timer = setInterval(() => {

      if (this.sales) {

        clearInterval(timer);

        setTimeout(() => {
          window.print();
        }, 300);

      }

    }, 100);

  }

}