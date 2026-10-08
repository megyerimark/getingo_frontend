import { Injectable } from '@angular/core';
import { ProjectValidationType } from '../core/models/project.model';

export interface RunnerMessage {
  source: 'getingo-project-runner';
  token: string;
  projectId: number;
  output: string[];
  done: boolean;
}

interface PreviewDocumentInput {
  projectId: number;
  token: string;
  html: string;
  css: string;
  javascript: string;
  executeJavascript?: boolean;
  darkMode?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProjectRunnerService {
  private readonly maxOutputLines = 200;
  private readonly maxOutputLineLength = 1000;

  createToken(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  isConsoleValidation(type?: ProjectValidationType): boolean {
    return type === 'console_exact' || type === 'console_contains';
  }

  hasObviousInfiniteLoop(code: string): boolean {
    const normalized = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/(['"`])(?:\\.|(?!\1)[\s\S])*?\1/g, '');

    return /\bwhile\s*\(\s*true\s*\)/i.test(normalized)
      || /\bwhile\s*\(\s*1\s*\)/i.test(normalized)
      || /\bfor\s*\(\s*;\s*;\s*\)/i.test(normalized);
  }

  runConsoleJavaScript(code: string, timeoutMs = 1500): Promise<string[]> {
    if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || !globalThis.URL?.createObjectURL) {
      return Promise.resolve(['HIBA: A biztonságos JavaScript Worker ebben a böngészőben nem érhető el.']);
    }

    const workerSource = `
      const output = [];
      const MAX_LINES = ${this.maxOutputLines};
      const MAX_LENGTH = ${this.maxOutputLineLength};
      const formatValue = (value) => {
        if (typeof value === 'string') return value.slice(0, MAX_LENGTH);
        try {
          const json = JSON.stringify(value);
          return (json === undefined ? String(value) : json).slice(0, MAX_LENGTH);
        } catch {
          return String(value).slice(0, MAX_LENGTH);
        }
      };
      const pushLine = (line) => {
        if (output.length < MAX_LINES) {
          output.push(String(line).slice(0, MAX_LENGTH));
          return true;
        }
        if (output.length === MAX_LINES) {
          output.push('… A konzolkimenet korlátozva lett.');
          return true;
        }
        return false;
      };
      ['log', 'info', 'warn', 'error'].forEach((method) => {
        console[method] = (...args) => pushLine(args.map(formatValue).join(' '));
      });
      self.fetch = () => Promise.reject(new Error('A hálózati hozzáférés a Project Labban le van tiltva.'));
      self.importScripts = () => { throw new Error('Külső szkriptek betöltése a Project Labban le van tiltva.'); };
      self.WebSocket = class { constructor() { throw new Error('A hálózati hozzáférés a Project Labban le van tiltva.'); } };
      self.EventSource = class { constructor() { throw new Error('A hálózati hozzáférés a Project Labban le van tiltva.'); } };
      try {
        (() => {
          ${code}
        })();
      } catch (error) {
        pushLine('HIBA: ' + (error instanceof Error ? error.message : String(error)));
      }
      self.postMessage({ source: 'getingo-console-worker', output });
    `;

    return new Promise(resolve => {
      const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
      const worker = new Worker(blobUrl);
      let settled = false;

      const finish = (output: string[]) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        worker.terminate();
        URL.revokeObjectURL(blobUrl);
        resolve(output);
      };

      const timeout = globalThis.setTimeout(() => {
        finish([`HIBA: A program futása túllépte a ${timeoutMs} ms-os időkorlátot, ezért leállítottuk.`]);
      }, timeoutMs);

      worker.onmessage = (event: MessageEvent<unknown>) => {
        const data = event.data as { source?: unknown; output?: unknown };
        if (data?.source !== 'getingo-console-worker' || !Array.isArray(data.output)) return;
        const output = data.output.filter((line): line is string => typeof line === 'string').slice(0, this.maxOutputLines + 1);
        finish(output);
      };

      worker.onerror = event => {
        finish([`HIBA: ${event.message || 'A JavaScript futtatása sikertelen.'}`]);
      };
    });
  }

  buildPreviewDocument(input: PreviewDocumentInput): string {
    const safeCss = input.css.replace(/<\/style/gi, '<\\/style');
    const safeJs = input.javascript.replace(/<\/script/gi, '<\\/script');
    const dark = input.darkMode === true;
    const colorScheme = dark ? 'dark' : 'light';
    const background = dark ? '#0b1220' : '#ffffff';
    const text = dark ? '#eaf1fb' : '#172033';

    if (input.executeJavascript === false) {
      return `<!doctype html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'none'; img-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none';">
  <style>
    :root { color-scheme: ${colorScheme}; }
    body { margin: 0; padding: 18px; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: ${text}; background: ${background}; }
    ${safeCss}
  </style>
</head>
<body>
  ${input.html}
</body>
</html>`;
    }

    const tokenJson = JSON.stringify(input.token);
    const scriptNonce = input.token.replace(/[^a-zA-Z0-9_-]/g, '');

    return `<!doctype html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${scriptNonce}'; img-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none';">
  <style>
    :root { color-scheme: ${colorScheme}; }
    body { margin: 0; padding: 18px; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: ${text}; background: ${background}; }
    ${safeCss}
  </style>
</head>
<body>
  ${input.html}
  <script nonce="${scriptNonce}">
    (() => {
      const output = [];
      const token = ${tokenJson};
      const MAX_LINES = ${this.maxOutputLines};
      const MAX_LENGTH = ${this.maxOutputLineLength};
      const formatValue = (value) => {
        if (typeof value === 'string') return value.slice(0, MAX_LENGTH);
        try {
          const json = JSON.stringify(value);
          return (json === undefined ? String(value) : json).slice(0, MAX_LENGTH);
        } catch {
          return String(value).slice(0, MAX_LENGTH);
        }
      };
      const pushLine = (line) => {
        if (output.length < MAX_LINES) {
          output.push(String(line).slice(0, MAX_LENGTH));
          return true;
        }
        if (output.length === MAX_LINES) {
          output.push('… A konzolkimenet korlátozva lett.');
          return true;
        }
        return false;
      };
      const send = (done = false) => {
        parent.postMessage({
          source: 'getingo-project-runner',
          token,
          projectId: ${input.projectId},
          output: [...output],
          done
        }, '*');
      };
      ['log', 'info', 'warn', 'error'].forEach((method) => {
        const original = console[method].bind(console);
        console[method] = (...args) => {
          const changed = pushLine(args.map(formatValue).join(' '));
          original(...args);
          if (changed) send(false);
        };
      });
      window.addEventListener('error', (event) => {
        pushLine('HIBA: ' + event.message);
        send(false);
      });
      try {
        (() => {
          ${safeJs}
        })();
      } catch (error) {
        pushLine('HIBA: ' + (error instanceof Error ? error.message : String(error)));
      }
      window.setTimeout(() => send(true), 180);
    })();
  <\/script>
</body>
</html>`;
  }

  isRunnerMessage(value: unknown): value is RunnerMessage {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<RunnerMessage>;
    return candidate.source === 'getingo-project-runner'
      && typeof candidate.token === 'string'
      && typeof candidate.projectId === 'number'
      && Array.isArray(candidate.output)
      && candidate.output.every(item => typeof item === 'string')
      && typeof candidate.done === 'boolean';
  }
}
