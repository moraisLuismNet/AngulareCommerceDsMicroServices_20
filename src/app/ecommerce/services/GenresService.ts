import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthGuard } from 'src/app/guards/AuthGuardService';
import { IGenre } from '../EcommerceInterface';

@Injectable({
  providedIn: 'root',
})
export class GenresService {
  private readonly baseUrl = environment.apiUrl.cdService;
  private readonly http = inject(HttpClient);
  private readonly authGuard = inject(AuthGuard);

  constructor() {}

  getGenres(): Observable<IGenre[]> {
    const headers = this.getHeaders();
    return this.http.get<IGenre[]>(`${this.baseUrl}musicGenres`, {
      headers,
    });
  }

  addGenre(genre: IGenre): Observable<IGenre> {
    const headers = this.getHeaders();
    return this.http.post<IGenre>(`${this.baseUrl}musicGenres`, genre, {
      headers,
    });
  }

  updateGenre(Genre: IGenre): Observable<IGenre> {
    const headers = this.getHeaders();
    return this.http.put<IGenre>(
      `${this.baseUrl}musicGenres/${Genre.idMusicGenre}`,
      Genre,
      {
        headers,
      }
    );
  }

  deleteGenre(id: number): Observable<IGenre> {
    const headers = this.getHeaders();
    return this.http.delete<IGenre>(`${this.baseUrl}musicGenres/${id}`, {
      headers,
    });
  }

  getHeaders(): HttpHeaders {
    const token = this.authGuard.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return headers;
  }
}
