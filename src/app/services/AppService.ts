import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ILogin, ILoginResponse } from '../interfaces/LoginInterface';
import { IRegister } from '../interfaces/RegisterInterface';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private readonly baseUrl = environment.apiUrl.userService;
  private readonly http = inject(HttpClient);

  login(credentials: ILogin): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(
      `${this.baseUrl}auth/login`,
      credentials
    );
  }

  register(user: IRegister) {
    return this.http.post<any>(`${this.baseUrl}auth/register`, user);
  }
}
