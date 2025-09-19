import {
  Component,
  OnInit,
  OnDestroy,
  afterNextRender,
  effect,
  ChangeDetectorRef,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, of } from "rxjs";
import { takeUntil, filter, map, catchError, tap } from "rxjs/operators";
import { RouterModule, ActivatedRoute } from "@angular/router";

// PrimeNG Modules
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService, MessageService } from "primeng/api";

// Services
import { ICartDetail, IRecord } from "../EcommerceInterface";
import { AuthGuard } from "src/app/guards/AuthGuardService";
import { UserService } from "src/app/services/UserService";
import { CartDetailService } from "../services/CartDetailService";
import { CartService } from "src/app/ecommerce/services/CartService";
import { OrderService } from "../services/OrderService";

interface CartDetailItem {
  idCartDetail: number;
  cartId: number;
  recordId: number;
  imageRecord: string;
  titleRecord: string;
  groupName: string;
  amount: number;
  price: number;
  total: number;
}

interface CartResponse {
  $values?: CartDetailItem[];
}

// Extended interface that includes all ICartDetail properties plus any additional ones we need
interface ExtendedCartDetail extends ICartDetail {
  // These properties are already in ICartDetail but we might want to make them required
  // or add additional documentation
  recordTitle: string; // Keep for backward compatibility

  // Additional properties that might be added by the component
  record?: IRecord; // Full record details if available

  // Any other computed or derived properties can go here
  [key: string]: any; // Allow additional properties
}

@Component({
  selector: "app-cart-details",
  standalone: true,
  templateUrl: "./CartDetailsComponent.html",
  styleUrls: ["./CartDetailsComponent.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    ConfirmDialogModule,
    DecimalPipe,
  ],
  providers: [ConfirmationService, MessageService],
})
export class CartDetailsComponent implements OnInit, OnDestroy {
  cartDetails: ICartDetail[] = [];
  filteredCartDetails: ExtendedCartDetail[] = [];
  emailUser: string | null = "";
  loading = false;
  isAddingToCart = false;
  private readonly destroy$ = new Subject<void>();
  currentViewedEmail: string = "";
  isViewingAsAdmin: boolean = false;
  isCreatingOrder = false;
  alertMessage: string = "";
  alertType: "success" | "error" | null = null;

  private readonly cartDetailService = inject(CartDetailService);
  private readonly route = inject(ActivatedRoute);
  private readonly authGuard = inject(AuthGuard);
  private readonly userService = inject(UserService);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    // Use afterNextRender for one-time initialization after the component is created
    afterNextRender(() => {
      this.initializeComponent();
    });

    // Use afterNextRender for DOM-dependent operations
    afterNextRender(() => {
      // This will run after every change detection cycle
      // Can be used for DOM measurements or other operations that need the view to be stable
    });

    // Reactive effect for user email changes - only update if not viewing a specific user's cart
    effect(() => {
      const email = this.userService.email;
      const hasViewingParam =
        this.route.snapshot.queryParams["viewingUserEmail"];

      if (email && !hasViewingParam && !this.isViewingAsAdmin) {
        this.currentViewedEmail = email;
        this.loadCartDetails(email);
      }
    });
  }

  private initializeComponent(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const viewingUserEmail = params["viewingUserEmail"];

        if (viewingUserEmail) {
          // Always use the viewingUserEmail parameter when provided
          this.isViewingAsAdmin = this.userService.isAdmin();
          this.currentViewedEmail = viewingUserEmail;
          this.loadCartDetails(viewingUserEmail);
          this.cdr.detectChanges();
        } else if (!this.currentViewedEmail && this.userService.email) {
          // If no viewingUserEmail parameter, load the current user's cart
          this.isViewingAsAdmin = false;
          this.currentViewedEmail = this.userService.email;
          this.loadCartDetails(this.userService.email);
        }
      });
  }

  ngOnInit(): void {
    // Component initialization logic
  }

  // Method to extract the group name from several possible locations
  private extractGroupName(detail: any): string {
    if (!detail) return "N/A";

    // List of possible group name locations
    const possibleGroupPaths = [
      detail.groupName,
      detail.nameGroup,
      detail.group?.name,
      detail.record?.groupName,
      detail.record?.nameGroup,
      detail.record?.group?.name,
      detail.record?.recordGroup?.name,
      detail.recordGroup?.name,
      detail.record?.group?.groupName,
      detail.record?.recordGroup?.groupName,
      detail.record?.group?.description,
      detail.record?.recordGroup?.description,
    ];

    // Find the first valid value
    const groupName = possibleGroupPaths.find(
      (name) =>
        name !== undefined &&
        name !== null &&
        name !== "" &&
        name !== "N/A" &&
        name !== "string"
    );

    // Clean up the group name if it contains HTML entities or extra spaces
    if (typeof groupName === "string") {
      // Remove HTML entities and trim
      const cleanName = groupName
        .replace(/&[^;]+;/g, "") // Remove HTML entities
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim();

      return cleanName || "N/A";
    }

    return "N/A";
  }

  private loadCartDetails(email: string): void {
    // Check if the current user is an admin and trying to view their own cart
    if (this.userService.isAdmin() && email === this.userService.email) {
      this.cartDetails = [];
      this.filteredCartDetails = [];
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    // Notify cart service that we're viewing a cart
    this.cartService.updateCartNavbar(
      this.cartDetails.length,
      this.cartDetails.reduce(
        (sum, item) => sum + (item.price || 0) * (item.amount || 0),
        0
      )
    );

    this.loading = true;
    this.cdr.detectChanges(); // Trigger change detection to show loading state

    this.cartDetailService
      .getCartDetailsByEmail(email)
      .pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          // If the response is empty or invalid, return empty array
          if (!response) {
            return [];
          }

          // Handle different response formats
          let details = [];

          // Handle array response
          if (Array.isArray(response)) {
            details = response;
          }
          // Handle { $id: "1", $values: [...] } format
          else if (response.$values && Array.isArray(response.$values)) {
            details = response.$values;
          }
          // Handle plain object with numeric keys
          else if (typeof response === "object") {
            details = Object.values(response);
          }

          // Filter out any invalid items and map to expected format
          return details
            .filter((detail: any) => detail && typeof detail === "object")
            .map((detail: any) => {
              // Extract group information from various possible locations
              const groupName = this.extractGroupName(detail);
              const title =
                detail.titleRecord ||
                detail.recordTitle ||
                detail.record?.titleRecord ||
                "No Title";
              const imageUrl =
                detail.imageRecord ||
                detail.record?.imageRecord ||
                "assets/img/placeholder.png";
              const price = detail.price || detail.record?.price || 0;
              const amount = detail.amount || 0;

              // Return a properly formatted cart detail object
              return {
                idCartDetail: detail.idCartDetail || 0,
                recordId: detail.recordId || 0,
                amount: amount,
                cartId: detail.cartId || 0,
                recordTitle: title,
                titleRecord: title, // For backward compatibility
                groupName: groupName,
                price: price,
                total: price * amount,
                imageRecord: imageUrl,
                record: detail.record || {},
              };
            });
        }),
        catchError((error) => {
          console.error("Error loading cart details:", error);
          // Only show error if not a 404 (which might just mean the cart is empty)
          if (error.status !== 404) {
            console.error("Failed to load cart details", error);
          }
          return of([]);
        })
      )
      .subscribe({
        next: (details) => {
          this.cartDetails = Array.isArray(details) ? details : [];
          this.filteredCartDetails = this.getFilteredCartDetails();

          // Update loading state and UI
          this.loading = false;

          // Update cart count and total in the navbar
          const itemCount = this.cartDetails.reduce(
            (sum, item) => sum + (item.amount || 0),
            0
          );
          const cartTotal = this.cartDetails.reduce(
            (sum, item) => sum + (item.price || 0) * (item.amount || 0),
            0
          );

          this.cartService.updateCartNavbar(itemCount, cartTotal);

          // Only load record details if we have items
          if (this.filteredCartDetails.length > 0) {
            this.loadRecordDetails();
          } else {
            this.updateCartTotals();
          }

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error("Error in cart details subscription:", error);
          this.loading = false;
          this.cartDetails = [];
          this.filteredCartDetails = [];
          this.cdr.detectChanges();
          this.updateCartTotals();
        },
      });
  }

  private loadRecordDetails(): void {
    if (!this.filteredCartDetails || this.filteredCartDetails.length === 0) {
      this.loading = false;
      this.cdr.detectChanges();
      this.updateCartTotals();
      return;
    }

    let completedRequests = 0;
    const totalRequests = this.filteredCartDetails.length;

    this.filteredCartDetails.forEach((detail) => {
      this.cartDetailService
        .getRecordDetails(detail.recordId)
        .pipe(
          takeUntil(this.destroy$),
          filter((record): record is IRecord => record !== null),
          catchError((error) => {
            console.error(
              `Error loading record details for record ${detail.recordId}:`,
              error
            );
            return of(null);
          })
        )
        .subscribe((record) => {
          if (!record) {
            console.warn(
              `No record details found for recordId: ${detail.recordId}`
            );
            completedRequests++;
            if (completedRequests >= totalRequests) {
              this.loading = false;
              this.cdr.detectChanges();
              this.updateCartTotals();
            }
            return;
          }

          const index = this.filteredCartDetails.findIndex(
            (d) => d.recordId === detail.recordId
          );

          if (index !== -1) {
            try {
              const groupName = this.extractGroupName(record);
              const title =
                record.titleRecord ||
                this.filteredCartDetails[index].titleRecord ||
                "No Title";
              const imageUrl =
                record.imageRecord ||
                this.filteredCartDetails[index].imageRecord ||
                "assets/img/placeholder.png";
              const price =
                record.price || this.filteredCartDetails[index].price || 0;
              const amount = this.filteredCartDetails[index].amount || 0;

              const updatedDetail = {
                ...this.filteredCartDetails[index],
                stock: record.stock,
                groupName: groupName,
                titleRecord: title,
                recordTitle: title, // For backward compatibility
                price: price,
                imageRecord: imageUrl,
                total: price * amount,
                record: { ...record }, // Store the full record for reference
              } as ExtendedCartDetail;

              // Update the filtered cart details array immutably
              this.filteredCartDetails = [
                ...this.filteredCartDetails.slice(0, index),
                updatedDetail,
                ...this.filteredCartDetails.slice(index + 1),
              ];

              // Also update the main cart details array for consistency
              const cartDetailIndex = this.cartDetails.findIndex(
                (d) => d.recordId === detail.recordId
              );

              if (cartDetailIndex !== -1) {
                this.cartDetails = [
                  ...this.cartDetails.slice(0, cartDetailIndex),
                  { ...this.cartDetails[cartDetailIndex], ...updatedDetail },
                  ...this.cartDetails.slice(cartDetailIndex + 1),
                ];
              }
            } catch (error) {
              console.error(
                `Error updating cart detail for record ${detail.recordId}:`,
                error
              );
            }
          }

          // Check if all requests are completed
          completedRequests++;
          if (completedRequests >= totalRequests) {
            this.loading = false;
            this.cdr.detectChanges();
            this.updateCartTotals();
          }
        });
    });
  }

  private getFilteredCartDetails(): ExtendedCartDetail[] {
    if (!Array.isArray(this.cartDetails)) return [];

    return this.cartDetails
      .filter(
        (detail) =>
          detail && typeof detail.amount === "number" && detail.amount > 0
      )
      .map((detail) => {
        // Create a new object with all properties from detail
        const extendedDetail: any = { ...detail };

        // Ensure all required properties have values
        extendedDetail.idCartDetail = detail.idCartDetail || 0;
        extendedDetail.recordId = detail.recordId || 0;
        extendedDetail.amount = detail.amount || 0;
        extendedDetail.cartId = detail.cartId || 0;
        extendedDetail.titleRecord =
          detail.titleRecord || detail.recordTitle || "No Title";
        extendedDetail.groupName = detail.groupName || "N/A";
        extendedDetail.imageRecord =
          detail.imageRecord || "assets/img/placeholder.png";
        extendedDetail.price = detail.price || 0;
        extendedDetail.total = detail.total || 0;
        extendedDetail.stock = detail.stock || 0;

        // Backward compatibility
        extendedDetail.recordTitle =
          detail.recordTitle || detail.titleRecord || "No Title";

        // Handle the record property separately to avoid type issues
        if (detail.record) {
          extendedDetail.record = { ...detail.record };
        } else {
          extendedDetail.record = undefined;
        }

        return extendedDetail as ExtendedCartDetail;
      });
  }

  async addToCart(detail: ICartDetail): Promise<void> {
    if (!this.currentViewedEmail || this.isAddingToCart) return;

    this.isAddingToCart = true;
    this.clearAlert();

    try {
      const updatedDetail = await this.cartDetailService
        .addToCartDetail(this.currentViewedEmail, detail.recordId, 1)
        .toPromise();

      // Update UI locally first for better user experience
      const itemIndex = this.filteredCartDetails.findIndex(
        (d) => d.recordId === detail.recordId
      );
      if (itemIndex !== -1) {
        const updatedItem = {
          ...this.filteredCartDetails[itemIndex],
          amount: (this.filteredCartDetails[itemIndex].amount || 0) + 1,
          stock:
            updatedDetail?.stock || this.filteredCartDetails[itemIndex].stock,
        };
        this.filteredCartDetails[itemIndex] = updatedItem;
        this.updateCartTotals();
      }

      // Refresh data from the server
      await this.loadCartDetails(this.currentViewedEmail);

      // Update the stock value in the UI
      const updatedRecord = await this.cartDetailService
        .getRecordDetails(detail.recordId)
        .toPromise();
      if (updatedRecord) {
        const stockIndex = this.filteredCartDetails.findIndex(
          (d) => d.recordId === detail.recordId
        );
        if (stockIndex !== -1) {
          this.filteredCartDetails[stockIndex].stock = updatedRecord.stock;
        }
      }

      this.showAlert("Product added to cart", "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      this.showAlert("Failed to add product to cart", "error");
      // Revert local changes if it fails
      const itemIndex = this.filteredCartDetails.findIndex(
        (d) => d.recordId === detail.recordId
      );
      if (itemIndex !== -1) {
        this.filteredCartDetails[itemIndex].amount -= 1;
        this.updateCartTotals();
      }
    } finally {
      this.isAddingToCart = false;
    }
  }

  async removeRecord(detail: ICartDetail): Promise<void> {
    if (!this.currentViewedEmail || detail.amount <= 0) return;

    try {
      await this.cartDetailService
        .removeFromCartDetail(this.currentViewedEmail, detail.recordId, 1)
        .toPromise();

      // Update UI locally first for better user experience
      const itemIndex = this.filteredCartDetails.findIndex(
        (d) => d.recordId === detail.recordId
      );
      if (itemIndex !== -1) {
        const updatedItem = {
          ...this.filteredCartDetails[itemIndex],
          amount: Math.max(
            0,
            (this.filteredCartDetails[itemIndex].amount || 0) - 1
          ),
        };
        this.filteredCartDetails[itemIndex] = updatedItem;
        this.updateCartTotals();
      }

      // Refresh data from the server
      await this.loadCartDetails(this.currentViewedEmail);

      // Sync CartService with backend to ensure state consistency
      this.cartService.syncCartWithBackend(this.currentViewedEmail);

      // Update the stock value in the UI
      const updatedRecord = await this.cartDetailService
        .getRecordDetails(detail.recordId)
        .toPromise();
      if (updatedRecord) {
        const stockIndex = this.filteredCartDetails.findIndex(
          (d) => d.recordId === detail.recordId
        );
        if (stockIndex !== -1) {
          this.filteredCartDetails[stockIndex].stock = updatedRecord.stock;
        }
      }

      this.showAlert("Product removed from cart", "success");
    } catch (error) {
      console.error("Error removing from cart:", error);
      this.showAlert("Failed to remove product from cart", "error");
      // On error, reload the cart from server to ensure UI is in sync with backend
      await this.loadCartDetails(this.currentViewedEmail);
      // Sync CartService even on error to maintain consistency
      this.cartService.syncCartWithBackend(this.currentViewedEmail);
    }
  }

  private updateCartTotals(): void {
    const totalItems = this.filteredCartDetails.reduce(
      (sum, d) => sum + d.amount,
      0
    );
    const totalPrice = this.filteredCartDetails.reduce(
      (sum, d) => sum + (d.price || 0) * d.amount,
      0
    );
    this.cartService.updateCartNavbar(totalItems, totalPrice);
  }
  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  async createOrder(): Promise<void> {
    if (!this.currentViewedEmail || this.isViewingAsAdmin) return;

    this.isCreatingOrder = true;
    this.clearAlert();

    try {
      const paymentMethod = "credit-card";
      const order = await this.orderService
        .createOrderFromCart(this.currentViewedEmail, paymentMethod)
        .toPromise();

      this.showAlert("Order created successfully", "success");
      await this.loadCartDetails(this.currentViewedEmail);
      // Sync CartService with backend to ensure cart state is reset after order
      this.cartService.syncCartWithBackend(this.currentViewedEmail);
      this.cartService.updateCartNavbar(0, 0);
    } catch (error: any) {
      console.error("Full error:", error);
      const errorMsg = error.error?.message || "Failed to create order";
      this.showAlert(errorMsg, "error");
    } finally {
      this.isCreatingOrder = false;
    }
  }

  private showAlert(message: string, type: "success" | "error"): void {
    this.alertMessage = message;
    this.alertType = type;

    // Hide the message after 5 seconds
    setTimeout(() => this.clearAlert(), 5000);
  }

  private clearAlert(): void {
    this.alertMessage = "";
    this.alertType = null;
  }
}
