import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type RemoteCodeLanguage = 'python' | 'csharp' | 'sql';

export interface CodeExecutionResponse {
  language: RemoteCodeLanguage;
  provider: 'judge0' | 'onecompiler' | 'piston' | string;
  runtime?: string | null;
  status: string;
  output: string;
  stdout: string;
  stderr: string;
  compile_output: string;
  time?: string | null;
  memory?: number | null;
  sql_dialect?: string | null;
  warning?: string | null;
}

export interface CodeRunnerCapability {
  provider: string;
  configured: boolean;
  fallback_provider?: string | null;
  fallback_configured?: boolean;
  sandboxed: boolean;
}

export interface CodeRunnerCapabilitiesResponse {
  languages: Record<RemoteCodeLanguage, CodeRunnerCapability>;
}

@Injectable({ providedIn: 'root' })
export class CodeExecutionService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  run(language: RemoteCodeLanguage, code: string, stdin = ''): Observable<CodeExecutionResponse> {
    return this.http.post<CodeExecutionResponse>(
      `${this.apiUrl}/code/run`,
      { language, code, stdin },
      { withCredentials: true }
    );
  }

  capabilities(): Observable<CodeRunnerCapabilitiesResponse> {
    return this.http.get<CodeRunnerCapabilitiesResponse>(`${this.apiUrl}/code/capabilities`);
  }
}
