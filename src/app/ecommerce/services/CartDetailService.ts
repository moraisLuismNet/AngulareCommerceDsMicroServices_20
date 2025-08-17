import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  catchError,
  Observable,
  of,
  tap,
  map,
  throwError,
  switchMap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthGuard } from '../../guards/AuthGuardService';
import { ICartDetail, IRecord } from '../EcommerceInterface';
import { UserService } from 'src/app/services/UserService';
import { StockService } from './StockService';
import { RecordsService } from './RecordsService';

@Injectable({
  providedIn: 'root',
})
export class CartDetailService {
  urlAPI = environment.apiUrl.shoppingService;
  private cart: IRecord[] = [];
  
  private http = inject(HttpClient);
  private authGuard = inject(AuthGuard);
  private userService = inject(UserService);
  private stockService = inject(StockService);
  private recordsService = inject(RecordsService);
  
  constructor() {}

  getCartItemCount(email: string): Observable<any> {
    // Verify that the email matches the current user
    if (this.userService.email !== email) {
      return of({ totalItems: 0 });
    }
    const headers = this.getHeaders();
    return this.http
      .get(`${this.urlAPI}CartDetails/GetCartItemCount/${encodeURIComponent(email)}`, { headers })
      .pipe(
        catchError((error) => {
          console.error('Error getting cart item count:', error);
          return of({ totalItems: 0 });
        })
      );
  }

  getCartDetails(email: string): Observable<{ $values: any[] }> {
    // Check if the user is authenticated before making the request
    if (!this.authGuard.isLoggedIn()) {
      console.warn('[CartDetailService] User is not authenticated');
      return of({ $values: [] });
    }

    const currentUser = this.authGuard.getUser();
    const isAdmin = this.authGuard.getRole() === 'Admin';
    
    // Allow access if the user is an admin or if they're accessing their own cart
    if (email !== currentUser && !isAdmin) {
      console.warn(`[CartDetailService] Access denied: User ${currentUser} cannot access cart for ${email}`);
      return of({ $values: [] });
    }

    // For admin users, we'll get the cart by email directly
    if (isAdmin) {
      return this.getCartDetailsByEmail(email).pipe(
        map(cartDetails => ({
          $values: Array.isArray(cartDetails) ? cartDetails : [cartDetails]
        })),
        catchError(error => {
          console.error('[CartDetailService] Error getting cart details by email:', error);
          return of({ $values: [] });
        })
      );
    }

    // For regular users, try to get the cart by ID first
    const cartId = this.authGuard.getCartId();
    if (!cartId) {
      // Fall back to email if no cart ID is available
      return this.getCartDetailsByEmail(email).pipe(
        map(cartDetails => ({
          $values: Array.isArray(cartDetails) ? cartDetails : [cartDetails]
        })),
        catchError(error => {
          console.error('[CartDetailService] Error getting cart details by email:', error);
          return of({ $values: [] });
        })
      );
    }
    
    const headers = this.getHeaders();
    const url = `${this.urlAPI}CartDetails/GetCartDetailsByCartId/${cartId}`;
    
    return this.http.get<{ $values: any[] } | any[]>(url, { 
      headers,
      observe: 'response'
    }).pipe(
      map(response => {
        const body = response.body;
        // Handle different possible response formats
        if (Array.isArray(body)) {
          return { $values: body };
        } else if (body && Array.isArray((body as any).$values)) {
          return body as { $values: any[] };
        } else if (body && typeof body === 'object') {
          // If the response is an object but doesn't have $values, return it as is
          return { $values: [body] };
        } else {
          return { $values: [] };
        }
      }),
      catchError((error) => {
        console.error('[CartDetailService] Error getting cart details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url,
          headers: error.headers
        });
        
        if (error.status === 403) {
          console.warn('[CartDetailService] Access denied - User does not have permission to access this cart');
        }
        
        // Fall back to email-based endpoint if cart ID approach fails
        if (error.status === 404) {
          return this.http.get<{ $values: any[] }>(
            `${this.urlAPI}CartDetails/GetCartDetails/${encodeURIComponent(email)}`,
            { headers }
          ).pipe(
            catchError(fallbackError => {
              console.error('[CartDetailService] Fallback endpoint also failed:', fallbackError);
              return of({ $values: [] });
            })
          );
        }
        
        return of({ $values: [] });
      })
    );
  }

  getRecordDetails(recordId: number): Observable<IRecord | null> {
    return this.recordsService.getRecordById(recordId).pipe(
      catchError((error) => {
        console.error('Error getting record details:', error);
        return of(null);
      })
    );
  }

  addToCartDetail(
    email: string,
    recordId: number,
    amount: number
  ): Observable<any> {
    const headers = this.getHeaders();
    
    return this.http
      .post(
        `${this.urlAPI}CartDetails/addToCartDetailAndCart/${encodeURIComponent(email)}?recordId=${recordId}&amount=${amount}`,
        {},
        { 
          headers,
          observe: 'response' 
        }
      )
      .pipe(
        switchMap((response: any) => {
          // Get the updated stock from the registry
          return this.getRecordDetails(recordId).pipe(
            map(record => {
              if (!record) {
                throw new Error('The updated record could not be obtained.');
              }
              return {
                success: true,
                recordId: recordId,
                amount: amount,
                stock: record.stock // Include updated stock
              };
            })
          );
        }),
        catchError((error) => {
          console.error('[CartDetailService] Error en addToCartDetail:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            url: error.url
          });
          return throwError(() => error);
        })
      );
  }

  removeFromCartDetail(
    email: string,
    recordId: number,
    amount: number
  ): Observable<any> {
    if (!email || !recordId) {
      return throwError(() => new Error('Invalid parameters'));
    }

    const headers = this.getHeaders();
    return this.http
      .post(
        `${this.urlAPI}CartDetails/removeFromCartDetailAndCart/${encodeURIComponent(email)}?recordId=${recordId}&amount=${amount}`,
        {},
        { 
          headers,
          observe: 'response'
        }
      )
      .pipe(
        switchMap((response: any) => {
          // Get the updated stock from the registry
          return this.getRecordDetails(recordId).pipe(
            map(record => {
              if (!record) {
                throw new Error('The updated record could not be obtained.');
              }
              return {
                success: true,
                recordId: recordId,
                amount: -amount,
                stock: record.stock // Include updated stock
              };
            })
          );
        }),
        catchError((error) => {
          console.error('[CartDetailService] Error removing from cart:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            url: error.url
          });
          return throwError(() => error);
        })
      );
  }

  addAmountCartDetail(detail: ICartDetail): Observable<ICartDetail> {
    return this.http.put<ICartDetail>(
      `${this.urlAPI}cartDetails/${detail.idCartDetail}`,
      detail
    );
  }

  updateRecordStock(recordId: number, change: number): Observable<IRecord> {
    if (typeof change !== 'number' || isNaN(change)) {
      return throwError(() => new Error('Invalid stock change value'));
    }

    return this.http
      .put<any>(
        `${this.urlAPI}records/${recordId}/updateStock/${change}`,
        {},
        { headers: this.getHeaders() }
      )
      .pipe(
        tap((response) => {
          const newStock = response?.newStock;
          if (typeof newStock === 'number' && newStock >= 0) {
            this.stockService.notifyStockUpdate(recordId, newStock);
          } else {
            throw new Error('Received invalid stock value from server');
          }
        }),
        map(
          (response) =>
            ({
              idRecord: recordId,
              stock: response.newStock,
              titleRecord: '',
              yearOfPublication: null,
              imageRecord: null,
              photo: null,
              price: 0,
              discontinued: false,
              groupId: null,
              groupName: '',
              nameGroup: '',
            } as IRecord)
        ),
        catchError((error) => {
          return throwError(
            () => new Error('Failed to update stock. Please try again.')
          );
        })
      );
  }

  getHeaders(): HttpHeaders {
    const token = this.authGuard.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return headers;
  }

  incrementQuantity(detail: ICartDetail): Observable<ICartDetail> {
    const previousAmount = detail.amount;
    detail.amount++;
    return new Observable((observer) => {
      this.addAmountCartDetail(detail).subscribe({
        next: () => {
          this.updateRecordStock(detail.recordId, -1).subscribe({
            next: () => {
              observer.next(detail);
              observer.complete();
            },
            error: (err) => {
              detail.amount = previousAmount;
              observer.error(err);
            },
          });
        },
        error: (err) => {
          detail.amount = previousAmount;
          observer.error(err);
        },
      });
    });
  }

  decrementQuantity(detail: ICartDetail): Observable<ICartDetail> {
    if (detail.amount <= 1) {
      // Do not allow quantities less than 1
      return of(detail); // Return the detail without changes
    }
    const previousAmount = detail.amount;
    detail.amount--;
    return new Observable((observer) => {
      this.addAmountCartDetail(detail).subscribe({
        next: () => {
          this.updateRecordStock(detail.recordId, 1).subscribe({
            next: () => {
              observer.next(detail);
              observer.complete();
            },
            error: (err) => {
              detail.amount = previousAmount;
              observer.error(err);
            },
          });
        },
        error: (err) => {
          detail.amount = previousAmount;
          observer.error(err);
        },
      });
    });
  }

  getCartDetailsByEmail(email: string): Observable<ICartDetail[]> {
    const headers = this.getHeaders();
    const url = `${this.urlAPI}cartdetails/getCartDetails/${encodeURIComponent(email)}`;
    
    return this.http.get<ICartDetail[] | { $values: ICartDetail[] }>(url, { 
      headers,
      observe: 'response' // Get the full response including status and headers
    }).pipe(
      map(response => {
        const body = response.body;
        
        // Handle different response formats
        if (Array.isArray(body)) {
          return body as ICartDetail[];
        } else if (body && (body as any).$values && Array.isArray((body as any).$values)) {
          return (body as any).$values as ICartDetail[];
        } else if (body && typeof body === 'object') {
          return Object.values(body).flat() as ICartDetail[];
        }
        console.warn(`[CartDetailService] Unexpected response format for ${email}:`, body);
        return [];
      }),
      catchError(error => {
        console.error(`[CartDetailService] Error getting cart details for ${email}:`, {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          error: error.error,
          headers: error.headers
        });
        return of([] as ICartDetail[]);
      })
    );
  }
}
