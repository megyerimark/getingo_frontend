import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PortfolioResponse } from '../core/models/portfolio.model';
import {
  Project,
  ProjectCheckPayload,
  ProjectCheckResponse,
  ProjectListResponse,
  ProjectMentorResponse,
  ProjectResponse,
  ProjectTimingResponse,
  ProjectWorkspacePayload
} from '../core/models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Project[]> {
    return this.http.get<ProjectListResponse>(`${this.apiUrl}/projects`, {
      withCredentials: true
    }).pipe(
      map(response => response.projects)
    );
  }

  getPortfolio(): Observable<PortfolioResponse> {
    return this.http.get<PortfolioResponse>(`${this.apiUrl}/portfolio`, {
      withCredentials: true
    });
  }

  getById(id: number): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.apiUrl}/projects/${id}`, {
      withCredentials: true
    });
  }

  start(id: number): Observable<ProjectTimingResponse> {
    return this.http.post<ProjectTimingResponse>(`${this.apiUrl}/projects/${id}/start`, {}, {
      withCredentials: true
    });
  }

  restart(id: number): Observable<ProjectTimingResponse> {
    return this.http.post<ProjectTimingResponse>(`${this.apiUrl}/projects/${id}/restart`, {}, {
      withCredentials: true
    });
  }

  saveWorkspace(id: number, payload: ProjectWorkspacePayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/projects/${id}/workspace`,
      payload,
      { withCredentials: true }
    );
  }

  check(id: number, payload: ProjectCheckPayload): Observable<ProjectCheckResponse> {
    return this.http.post<ProjectCheckResponse>(
      `${this.apiUrl}/projects/${id}/check`,
      payload,
      { withCredentials: true }
    );
  }

  mentor(id: number, payload: ProjectCheckPayload): Observable<ProjectMentorResponse> {
    return this.http.post<ProjectMentorResponse>(
      `${this.apiUrl}/projects/${id}/mentor`,
      payload,
      { withCredentials: true }
    );
  }
}
