import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Category } from '../core/models/category.model';
import { environment } from '../../environments/environment';
import {
  AdminExercise,
  AdminLesson,
  AdminLessonSection,
  AdminPage,
  AdminProject,
  AdminQuiz,
  AdminStats,
  AdminSubscriptionResponse,
  AdminRevenueResponse,
  AdminUser,
  AuditLog,
  DeletedUserRecord
} from '../core/models/admin.model';

type ApiCollection<T> = T[] | { data?: T[] };
type MessageResponse = { message?: string };
type ToggleBanResponse = MessageResponse & { is_banned: boolean };
type EntityResponse<K extends string, T> = MessageResponse & Record<K, T>;

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  private unwrap<T>(response: ApiCollection<T>): T[] {
    return Array.isArray(response) ? response : (response.data ?? []);
  }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/dashboard`);
  }

  getUsers(search = ''): Observable<AdminUser[]> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<ApiCollection<AdminUser>>(`${this.apiUrl}/users`, { params }).pipe(
      map(response => this.unwrap<AdminUser>(response))
    );
  }

  updateUserRole(id: number, role: 'student' | 'admin'): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.apiUrl}/users/${id}/role`, { role });
  }

  toggleBan(id: number): Observable<ToggleBanResponse> {
    return this.http.post<ToggleBanResponse>(`${this.apiUrl}/users/${id}/toggle-ban`, {});
  }

  deleteUser(id: number, password: string, reason: string, evidence?: File | null): Observable<{ message: string; email_sent: boolean; record_id: number }> {
    const body = new FormData();
    body.set('password', password);
    body.set('reason', reason);
    if (evidence) body.set('evidence', evidence, evidence.name);
    return this.http.post<{ message: string; email_sent: boolean; record_id: number }>(`${this.apiUrl}/users/${id}/delete`, body);
  }

  getDeletedUsers(search = ''): Observable<DeletedUserRecord[]> {
    let params = new HttpParams().set('per_page', 100);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<ApiCollection<DeletedUserRecord>>(`${this.apiUrl}/deleted-users`, { params }).pipe(
      map(response => this.unwrap<DeletedUserRecord>(response))
    );
  }

  downloadDeletionEvidence(id: number, token: string): Observable<Blob> {
    const headers = new HttpHeaders().set('X-Admin-Reauth', token);
    return this.http.get(`${this.apiUrl}/deleted-users/${id}/evidence`, { headers, responseType: 'blob' });
  }

  unlockSensitive(password: string): Observable<{ token: string; expires_in: number; message: string }> {
    return this.http.post<{ token: string; expires_in: number; message: string }>(`${this.apiUrl}/sensitive/unlock`, { password });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiCollection<Category>>(`${this.apiUrl}/categories`, {
      params: new HttpParams().set('per_page', 100)
    }).pipe(map(response => this.unwrap<Category>(response)));
  }

  getCategoriesPage(search = '', page = 1, perPage = 50): Observable<AdminPage<Category>> {
    let params = new HttpParams().set('page', page).set('per_page', perPage);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<AdminPage<Category>>(`${this.apiUrl}/categories`, { params });
  }

  createCategory(
    data: Omit<Category, 'id' | 'lessons_count' | 'exercises_count'>
  ): Observable<EntityResponse<'category', Category>> {
    return this.http.post<EntityResponse<'category', Category>>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(
    id: number,
    data: Omit<Category, 'id' | 'lessons_count' | 'exercises_count'>
  ): Observable<EntityResponse<'category', Category>> {
    return this.http.put<EntityResponse<'category', Category>>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/categories/${id}`);
  }

  getLessonSections(categoryId?: number): Observable<AdminLessonSection[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('category_id', categoryId);

    return this.http.get<ApiCollection<AdminLessonSection>>(`${this.apiUrl}/lesson-sections`, { params }).pipe(
      map(response => this.unwrap<AdminLessonSection>(response))
    );
  }

  createLessonSection(data: Omit<AdminLessonSection, 'id' | 'lessons_count' | 'category'>): Observable<EntityResponse<'section', AdminLessonSection>> {
    return this.http.post<EntityResponse<'section', AdminLessonSection>>(`${this.apiUrl}/lesson-sections`, data);
  }

  updateLessonSection(
    id: number,
    data: Omit<AdminLessonSection, 'id' | 'lessons_count' | 'category'>
  ): Observable<EntityResponse<'section', AdminLessonSection>> {
    return this.http.put<EntityResponse<'section', AdminLessonSection>>(`${this.apiUrl}/lesson-sections/${id}`, data);
  }

  deleteLessonSection(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/lesson-sections/${id}`);
  }

  getLessons(): Observable<AdminLesson[]> {
    return this.http.get<ApiCollection<AdminLesson>>(`${this.apiUrl}/lessons`).pipe(
      map(response => this.unwrap<AdminLesson>(response))
    );
  }

  createLesson(data: Omit<AdminLesson, 'id'>): Observable<EntityResponse<'lesson', AdminLesson>> {
    return this.http.post<EntityResponse<'lesson', AdminLesson>>(`${this.apiUrl}/lessons`, data);
  }

  updateLesson(
    id: number,
    data: Omit<AdminLesson, 'id'>
  ): Observable<EntityResponse<'lesson', AdminLesson>> {
    return this.http.put<EntityResponse<'lesson', AdminLesson>>(`${this.apiUrl}/lessons/${id}`, data);
  }

  deleteLesson(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/lessons/${id}`);
  }

  getExercises(): Observable<AdminExercise[]> {
    return this.http.get<ApiCollection<AdminExercise>>(`${this.apiUrl}/exercises`, {
      params: new HttpParams().set('per_page', 100)
    }).pipe(map(response => this.unwrap<AdminExercise>(response)));
  }

  getExercisesPage(search = '', categoryId: number | null = null, difficulty = '', page = 1, perPage = 50): Observable<AdminPage<AdminExercise>> {
    let params = new HttpParams().set('page', page).set('per_page', perPage);
    if (search.trim()) params = params.set('search', search.trim());
    if (categoryId) params = params.set('category_id', categoryId);
    if (difficulty) params = params.set('difficulty', difficulty);
    return this.http.get<AdminPage<AdminExercise>>(`${this.apiUrl}/exercises`, { params });
  }

  createExercise(data: Omit<AdminExercise, 'id'>): Observable<EntityResponse<'exercise', AdminExercise>> {
    return this.http.post<EntityResponse<'exercise', AdminExercise>>(`${this.apiUrl}/exercises`, data);
  }

  updateExercise(
    id: number,
    data: Omit<AdminExercise, 'id'>
  ): Observable<EntityResponse<'exercise', AdminExercise>> {
    return this.http.put<EntityResponse<'exercise', AdminExercise>>(`${this.apiUrl}/exercises/${id}`, data);
  }

  deleteExercise(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/exercises/${id}`);
  }

  getProjects(): Observable<AdminProject[]> {
    return this.http.get<ApiCollection<AdminProject>>(`${this.apiUrl}/projects`, {
      params: new HttpParams().set('per_page', 100)
    }).pipe(map(response => this.unwrap<AdminProject>(response)));
  }

  getProjectsPage(search = '', difficulty = '', validationType = '', page = 1, perPage = 50): Observable<AdminPage<AdminProject>> {
    let params = new HttpParams().set('page', page).set('per_page', perPage);
    if (search.trim()) params = params.set('search', search.trim());
    if (difficulty) params = params.set('difficulty', difficulty);
    if (validationType) params = params.set('validation_type', validationType);
    return this.http.get<AdminPage<AdminProject>>(`${this.apiUrl}/projects`, { params });
  }

  createProject(data: Omit<AdminProject, 'id'>): Observable<EntityResponse<'project', AdminProject>> {
    return this.http.post<EntityResponse<'project', AdminProject>>(`${this.apiUrl}/projects`, data);
  }

  updateProject(
    id: number,
    data: Omit<AdminProject, 'id'>
  ): Observable<EntityResponse<'project', AdminProject>> {
    return this.http.put<EntityResponse<'project', AdminProject>>(`${this.apiUrl}/projects/${id}`, data);
  }

  deleteProject(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/projects/${id}`);
  }

  getQuizzes(): Observable<AdminQuiz[]> {
    return this.http.get<ApiCollection<AdminQuiz>>(`${this.apiUrl}/quizzes`, {
      params: new HttpParams().set('per_page', 100)
    }).pipe(map(response => this.unwrap<AdminQuiz>(response)));
  }

  getQuizzesPage(search = '', lessonId: number | null = null, correctAnswer = '', page = 1, perPage = 50): Observable<AdminPage<AdminQuiz>> {
    let params = new HttpParams().set('page', page).set('per_page', perPage);
    if (search.trim()) params = params.set('search', search.trim());
    if (lessonId) params = params.set('lesson_id', lessonId);
    if (correctAnswer) params = params.set('correct_answer', correctAnswer);
    return this.http.get<AdminPage<AdminQuiz>>(`${this.apiUrl}/quizzes`, { params });
  }

  createQuiz(data: Omit<AdminQuiz, 'id'>): Observable<EntityResponse<'quiz', AdminQuiz>> {
    return this.http.post<EntityResponse<'quiz', AdminQuiz>>(`${this.apiUrl}/quizzes`, data);
  }

  updateQuiz(
    id: number,
    data: Omit<AdminQuiz, 'id'>
  ): Observable<EntityResponse<'quiz', AdminQuiz>> {
    return this.http.put<EntityResponse<'quiz', AdminQuiz>>(`${this.apiUrl}/quizzes/${id}`, data);
  }

  deleteQuiz(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/quizzes/${id}`);
  }



  getSubscriptions(search = '', status = 'all'): Observable<AdminSubscriptionResponse> {
    let params = new HttpParams().set('status', status);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<AdminSubscriptionResponse>(`${this.apiUrl}/subscriptions`, { params });
  }

  getRevenue(months = 12): Observable<AdminRevenueResponse> {
    return this.http.get<AdminRevenueResponse>(`${this.apiUrl}/revenue`, {
      params: new HttpParams().set('months', months)
    });
  }

  exportRevenue(filters: { search?: string; from?: string; to?: string; status?: string }): Observable<Blob> {
    let params = new HttpParams();
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get(`${this.apiUrl}/revenue/export`, { params, responseType: 'blob' });
  }

  syncStripeRevenue(): Observable<{ message: string; synced: number }> {
    return this.http.post<{ message: string; synced: number }>(`${this.apiUrl}/revenue/sync`, {});
  }

  getAuditLogs(token: string, filters: { search?: string; action?: string; from?: string; to?: string } = {}): Observable<AuditLog[]> {
    let params = new HttpParams().set('per_page', 100);
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.action?.trim()) params = params.set('action', filters.action.trim());
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    const headers = new HttpHeaders().set('X-Admin-Reauth', token);
    return this.http.get<ApiCollection<AuditLog>>(`${this.apiUrl}/audit-logs`, { params, headers }).pipe(
      map(response => this.unwrap<AuditLog>(response))
    );
  }

  exportAuditLogs(token: string, filters: { search?: string; action?: string; from?: string; to?: string } = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.action?.trim()) params = params.set('action', filters.action.trim());
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    const headers = new HttpHeaders().set('X-Admin-Reauth', token);
    return this.http.get(`${this.apiUrl}/audit-logs/export`, { params, headers, responseType: 'blob' });
  }
}