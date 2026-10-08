import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExerciseSubmissionState {
  id: number;
  answer: string;
  started_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  is_expired: boolean;
}

export interface StudentExercise {
  id: number;
  category_id: number;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: number;
  category?: { id: number; name: string; slug: string } | null;
  submission: ExerciseSubmissionState | null;
}

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  list(search = '', difficulty = ''): Observable<StudentExercise[]> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('search', search.trim());
    if (difficulty) params = params.set('difficulty', difficulty);
    return this.http.get<StudentExercise[]>(`${this.apiUrl}/exercises`, { params, withCredentials: true });
  }

  open(id: number): Observable<StudentExercise> {
    return this.http.get<StudentExercise>(`${this.apiUrl}/exercises/${id}`, { withCredentials: true });
  }

  save(id: number, answer: string): Observable<{ message: string; submission: ExerciseSubmissionState }> {
    return this.http.put<{ message: string; submission: ExerciseSubmissionState }>(
      `${this.apiUrl}/exercises/${id}/workspace`, { answer }, { withCredentials: true }
    );
  }
}
