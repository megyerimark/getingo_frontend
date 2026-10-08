import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CodeExecutionService, RemoteCodeLanguage } from '../../services/code-execution';
import { ThemeService } from '../../services/theme';

export type RunnerLanguage = 'web' | RemoteCodeLanguage;

@Component({
  selector: 'app-code-runner',
  imports: [FormsModule],
  templateUrl: './code-runner.html',
  styleUrl: './code-runner.scss'
})
export class CodeRunner {
  @Input() html = '';
  @Input() css = '';
  @Input() javascript = '';
  @Input() language: RunnerLanguage = 'web';
  @Input() code = '';

  @ViewChild('previewFrame') previewFrame?: ElementRef<HTMLIFrameElement>;

  hasRun = false;
  running = false;
  output = '';
  errorMessage = '';
  status = '';
  runtime = '';
  provider = '';
  warning = '';
  sqlDialect = '';
  executionTime: string | null = null;
  memory: number | null = null;
  stdin = '';

  constructor(private codeExecution: CodeExecutionService, private theme: ThemeService) {}

  get isRemote(): boolean {
    return this.language !== 'web';
  }

  get languageLabel(): string {
    const labels: Record<RunnerLanguage, string> = {
      web: 'Web előnézet',
      python: 'Python',
      csharp: 'C#',
      sql: 'SQL'
    };
    return labels[this.language];
  }

  run(): void {
    this.errorMessage = '';
    this.warning = '';

    if (this.language === 'web') {
      if (!this.previewFrame) return;
      this.previewFrame.nativeElement.srcdoc = this.buildDocument();
      this.hasRun = true;
      return;
    }

    if (!this.code.trim()) {
      this.errorMessage = 'Nincs futtatható kód.';
      return;
    }

    this.running = true;
    this.output = '';
    this.status = '';
    this.runtime = '';
    this.provider = '';
    this.sqlDialect = '';
    this.executionTime = null;
    this.memory = null;

    this.codeExecution.run(this.language, this.code, this.stdin).pipe(
      finalize(() => this.running = false)
    ).subscribe({
      next: response => {
        this.hasRun = true;
        this.output = response.output;
        this.status = response.status;
        this.runtime = response.runtime ?? '';
        this.provider = response.provider ?? '';
        this.warning = response.warning ?? '';
        this.sqlDialect = response.sql_dialect ?? '';
        this.executionTime = response.time ?? null;
        this.memory = response.memory ?? null;
      },
      error: error => {
        this.hasRun = true;
        this.errorMessage = error.error?.message ?? 'A kód futtatása most nem sikerült.';
      }
    });
  }

  clear(): void {
    if (this.previewFrame) this.previewFrame.nativeElement.srcdoc = '';
    this.hasRun = false;
    this.output = '';
    this.errorMessage = '';
    this.status = '';
    this.runtime = '';
    this.provider = '';
    this.warning = '';
    this.sqlDialect = '';
    this.executionTime = null;
    this.memory = null;
  }

  private buildDocument(): string {
    const safeCss = this.css.replace(/<\/style/gi, '<\\/style');
    const safeJavascript = this.javascript.replace(/<\/script/gi, '<\\/script');
    const dark = this.theme.isDark();
    const previewBackground = dark ? '#0b1220' : '#ffffff';
    const previewText = dark ? '#eaf1fb' : '#172033';
    const colorScheme = dark ? 'dark' : 'light';

    return `
      <!doctype html>
      <html lang="hu">
      <head>
        <meta charset="utf-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none';">
        <style>
          :root { color-scheme: ${colorScheme}; }
          html, body { min-height: 100%; background: ${previewBackground}; color: ${previewText}; }
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
          #console-output { margin-top: 20px; padding: 15px; min-height: 60px; background: #1e1e1e; color: #f8f8f2; border-radius: 6px; white-space: pre-wrap; font-family: monospace; }
          #console-output:empty { display: none; }
          ${safeCss}
        </style>
      </head>
      <body>
        <div id="app">${this.html}</div>
        <pre id="console-output"></pre>
        <script>
          const output = document.getElementById('console-output');
          function formatValue(value) {
            if (typeof value === 'object') {
              try { return JSON.stringify(value, null, 2); } catch { return String(value); }
            }
            return String(value);
          }
          function writeConsole(type, values) {
            output.textContent += (type ? type + ': ' : '') + values.map(formatValue).join(' ') + '\\n';
          }
          const originalLog = console.log.bind(console);
          const originalError = console.error.bind(console);
          const originalWarn = console.warn.bind(console);
          console.log = (...values) => { writeConsole('', values); originalLog(...values); };
          console.error = (...values) => { writeConsole('Error', values); originalError(...values); };
          console.warn = (...values) => { writeConsole('Warning', values); originalWarn(...values); };
          window.addEventListener('error', event => writeConsole('Error', [event.message]));
        <\/script>
        <script>${safeJavascript}<\/script>
      </body>
      </html>
    `;
  }
}
