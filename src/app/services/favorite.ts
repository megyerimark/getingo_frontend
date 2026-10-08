import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  toggle(lessonId: number): Observable<{ message: string; is_favorite: boolean }> {
    return this.http.post<{ message: string; is_favorite: boolean }>(`${this.apiUrl}/favorites/toggle`, {
      lesson_id: lessonId
    });
  }
}