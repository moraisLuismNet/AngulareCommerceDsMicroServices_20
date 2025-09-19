import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  ChangeDetectionStrategy,
  afterNextRender,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, NavigationEnd, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { MenuModule } from "primeng/menu";
import { BadgeModule } from "primeng/badge";
import { RippleModule } from "primeng/ripple";
import { filter, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

import { UserService } from "src/app/services/UserService";
import { CartService } from "src/app/ecommerce/services/CartService";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MenuModule,
    BadgeModule,
    RippleModule,
  ],
  templateUrl: "./NavbarComponent.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  // Injected services
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Component state
  emailUser: string | null = null;
  role: string | null = null;
  cartItemsCount = 0;
  cartTotal = 0;
  currentRoute = "";
  cartEnabled = true;

  // Private properties
  private destroy$ = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Initialize the current route
    this.currentRoute = this.router.url;

    // Set up router event subscription after initial render
    afterNextRender(() => {
      this.setupRouterSubscription();
    });
  }

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation helper methods
  isAdmin(): boolean {
    return this.role === "Admin";
  }

  isListGroupsPage(): boolean {
    return (
      this.currentRoute.includes("/listgroups") || this.currentRoute === "/"
    );
  }

  isOrdersPage(): boolean {
    return (
      this.currentRoute.includes("/admin-orders") ||
      this.currentRoute.includes("/orders")
    );
  }

  isGenresPage(): boolean {
    return (
      this.currentRoute.includes("/genres") || this.currentRoute === "/genres"
    );
  }

  isGroupsPage(): boolean {
    return (
      this.currentRoute.includes("/groups") || this.currentRoute === "/groups"
    );
  }

  isRecordsPage(): boolean {
    return (
      this.currentRoute.includes("/records") || this.currentRoute === "/records"
    );
  }

  isCartsPage(): boolean {
    return (
      this.currentRoute.includes("/carts") || this.currentRoute === "/carts"
    );
  }

  isUsersPage(): boolean {
    return (
      this.currentRoute.includes("/users") || this.currentRoute === "/users"
    );
  }

  isLoginPage(): boolean {
    return (
      this.currentRoute === "/login" || this.currentRoute.includes("/login")
    );
  }

  logout(): void {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
    this.userService.clearUser();
    this.cartService.resetCart();
    this.router.navigate(["/login"]);
  }

  // Private methods
  private updateCartEnabledState(): void {
    const disabledRoutes = ["/login", "/register"];
    const wasEnabled = this.cartEnabled;
    this.cartEnabled = !disabledRoutes.some((route) =>
      this.currentRoute.startsWith(route)
    );

    if (wasEnabled !== this.cartEnabled) {
      this.cdr.markForCheck();
    }
  }

  private setupRouterSubscription(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.currentRoute = event.url;
        this.updateCartEnabledState();
        this.cdr.markForCheck();
      });

    // Clean up subscriptions when component is destroyed
    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  navigateToCart(): void {
    if (this.cartEnabled) {
      this.router.navigate(["/cart-details"]);
    }
  }

  private setupSubscriptions(): void {
    // Subscribe to cart updates
    this.cartService.cartItemCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.cartItemsCount = count;
        this.cdr.markForCheck();
      });

    // Subscribe to cart total updates
    this.cartService.cartTotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe((total) => {
        this.cartTotal = total;
        this.cdr.markForCheck();
      });

    // Subscribe to user email changes
    this.userService.email$
      .pipe(takeUntil(this.destroy$))
      .subscribe((email) => {
        this.emailUser = email;
        this.cdr.markForCheck();
      });

    // Subscribe to user role changes
    this.userService.role$.pipe(takeUntil(this.destroy$)).subscribe((role) => {
      this.role = role;
      this.cdr.markForCheck();
    });
  }
}
