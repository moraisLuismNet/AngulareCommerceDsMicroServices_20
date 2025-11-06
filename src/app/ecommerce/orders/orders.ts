import {
  Component,
  OnDestroy,
  afterNextRender,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// RxJS
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

// Services
import { OrderService } from '../services/order';
import { UserService } from 'src/app/services/user';

// Interfaces
import { IOrder } from '../ecommerce.interface';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule, TableModule, ButtonModule],
  templateUrl: './orders.html',
})
export class OrdersComponent implements OnDestroy {
  orders: IOrder[] = [];
  filteredOrders: IOrder[] = [];
  loading = true;
  searchText: string = '';
  expandedOrderId: number | null = null;
  showDebugInfo = false;
  userEmail: string | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Use afterNextRender for one-time initialization after the component is created
    afterNextRender(() => {
      this.initializeComponent();
    });

    // Subscribe to email changes
    this.userService.email$
      .pipe(takeUntil(this.destroy$))
      .subscribe((email) => {
        if (email) {
          this.loadOrders(email);
        } else {
          this.orders = [];
          this.filteredOrders = [];
        }
      });
  }

  private initializeComponent(): void {
    // Initialize component
    this.userEmail = this.userService.email;
  }

  toggleDebugView(): void {
    this.showDebugInfo = !this.showDebugInfo;
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();

    // Force change detection
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 1000);
  }

  loadOrders(email: string): void {
    this.loading = true;
    // Force change detection
    this.cdr.markForCheck();

    this.orderService.getOrdersByUserEmail(email).subscribe({
      next: (orders) => {
        try {
          // Create a deep copy of the orders
          const ordersCopy = JSON.parse(JSON.stringify(orders));

          // Use setTimeout to ensure it runs in the next detection cycle
          setTimeout(() => {
            this.orders = ordersCopy;
            this.filteredOrders = [...ordersCopy];
            this.loading = false;
            // Force change detection
            this.cdr.markForCheck();
          });
        } catch (error) {
          console.error(' Error processing orders:', error);
          this.loading = false;
          this.orders = [];
          this.filteredOrders = [];
          this.cdr.markForCheck();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error processing orders. Please try again.',
          });
        }
      },
      error: (err) => {
        console.error(' Error loading orders:', {
          error: err,
          status: err?.status,
          mensaje: err?.message,
        });

        this.orders = [];
        this.filteredOrders = [];
        this.loading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error loading orders. Please try again.',
        });
      },
    });
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleOrderDetails(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  isOrderExpanded(orderId: number): boolean {
    return this.expandedOrderId === orderId;
  }

  filterOrders() {
    this.filteredOrders = this.orders.filter((order) =>
      order.orderDate.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  onSearchChange() {
    this.filterOrders();
  }
}
