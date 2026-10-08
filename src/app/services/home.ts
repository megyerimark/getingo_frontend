import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from '../core/models/category.model';

export interface HomeLesson {
  id: number;
  category_id: number;
  category_name: string;
  title: string;
  slug: string;
  excerpt: string;
  created_at?: string | null;
}

export interface HomePayload {
  categories: Category[];
  latest_lessons: HomeLesson[];
}

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getHome(): Observable<HomePayload> {
    return this.http.get<HomePayload>(`${this.apiUrl}/home`);
  }
}
