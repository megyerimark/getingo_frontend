import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Project,
  ProjectCheckResponse,
  ProjectTimingResponse,
  ProjectWorkspacePayload
} from '../../core/models/project.model';
import { ProjectService } from '../../services/project';
import { Auth } from '../../services/auth';
import { ThemeService } from '../../services/theme';
import { ProjectRunnerService } from '../../services/project-runner';

type EditorTab = 'html' | 'css' | 'javascript' | 'console';
type MentorTone = 'idle' | 'tip' | 'warning' | 'success';


@Component({
  selector: 'app-project-detail',
  imports: [FormsModule, RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetail implements OnInit, OnDestroy {
  @ViewChild('previewFrame') previewFrame?: ElementRef<HTMLIFrameElement>;

  project: Project | null = null;
  loading = true;
  error = '';

  activeTab: EditorTab = 'javascript';
  htmlCode = '';
  cssCode = '';
  javascriptCode = '';
  consoleOutput: string[] = [];

  savedMessage = '';
  checkMessage = '';
  checkPassed: boolean | null = null;
  saving = false;
  running = false;
  checking = false;
  starting = false;
  remainingSeconds = 0;

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  mentorOpen = false;
  mentorHint = 'Futtasd a kódot, majd kérj segítséget. A Mentor nem adja oda a kész megoldást, hanem rávezet a hibára.';
  mentorTone: MentorTone = 'idle';
  mentorAnalyzing = false;
  mentorSuggestions: string[] = [];
  mentorTier: 'standard' | 'pro' = 'standard';
  mentorFocusTab: EditorTab = 'javascript';

  private pendingCheck = false;
  private pendingMentor = false;
  private runnerToken = '';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    public auth: Auth,
    private theme: ThemeService,
    private runner: ProjectRunnerService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'Érvénytelen projektazonosító.';
      this.loading = false;
      return;
    }

    this.projectService.getById(id).subscribe({
      next: response => {
        this.project = response.project;
        const submission = response.submission;

        this.htmlCode = submission?.html_code ?? response.project.starter_html ?? '';
        this.cssCode = submission?.css_code ?? response.project.starter_css ?? '';
        this.javascriptCode = submission?.javascript_code ?? response.project.starter_javascript ?? '';

        if (this.javascriptCode.trim()) {
          this.activeTab = 'javascript';
        } else if (this.htmlCode.trim()) {
          this.activeTab = 'html';
        } else if (this.cssCode.trim()) {
          this.activeTab = 'css';
        }

        this.syncCountdown();
        this.loading = false;
        setTimeout(() => {
          if (this.isEditorLocked) this.renderStaticPreview();
          else this.runProject();
        }, 0);
      },
      error: () => {
        this.error = 'A projekt nem található vagy most nem tölthető be.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  get isTimeLocked(): boolean {
    return !!this.project?.is_expired && !this.project?.is_completed;
  }

  get isNotStarted(): boolean {
    return !!this.project && !this.project.is_completed && !this.project.timer_started;
  }

  get isEditorLocked(): boolean {
    return this.isNotStarted || this.isTimeLocked;
  }

  countdownLabel(): string {
    if (this.project?.is_completed) return 'Teljesítve';
    if (this.isNotStarted) return 'Még nem indult';
    if (this.isTimeLocked) return 'Lejárt';
    const total = Math.max(0, this.remainingSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  setTab(tab: EditorTab): void {
    this.activeTab = tab;
  }

  startProject(): void {
    if (!this.project || this.starting || !this.isNotStarted) return;
    this.starting = true;
    this.savedMessage = '';
    this.projectService.start(this.project.id).subscribe({
      next: response => {
        this.applyTiming(response);
        this.savedMessage = response.message;
        this.starting = false;
        this.runProject();
      },
      error: error => {
        if (error?.error) this.applyTiming(error.error);
        this.savedMessage = error?.error?.message ?? 'A projekt indítása nem sikerült.';
        this.starting = false;
      }
    });
  }

  restartProject(): void {
    if (!this.project || this.starting || !this.isTimeLocked) return;
    this.starting = true;
    this.savedMessage = '';
    this.projectService.restart(this.project.id).subscribe({
      next: response => {
        this.applyTiming(response);
        this.savedMessage = response.message;
        this.checkMessage = '';
        this.checkPassed = null;
        this.starting = false;
        this.runProject();
      },
      error: error => {
        if (error?.error) this.applyTiming(error.error);
        this.savedMessage = error?.error?.message ?? 'A projekt újraindítása nem sikerült.';
        this.starting = false;
      }
    });
  }

  saveWorkspace(): void {
    if (!this.project || this.saving || this.isEditorLocked) return;

    this.saving = true;
    this.savedMessage = '';

    this.projectService.saveWorkspace(this.project.id, this.workspacePayload()).subscribe({
      next: response => {
        this.savedMessage = response.message;
        this.saving = false;
      },
      error: error => {
        if (error?.status === 423) this.lockFromServer(error?.error);
        this.savedMessage = error?.error?.message ?? 'A mentés most nem sikerült. Próbáld újra.';
        this.saving = false;
      }
    });
  }

  runProject(checkAfterRun = false, mentorAfterRun = false): void {
    if (!this.project || !this.previewFrame || this.isEditorLocked) return;

    this.runnerToken = this.runner.createToken();
    this.pendingCheck = checkAfterRun;
    this.pendingMentor = mentorAfterRun;
    this.consoleOutput = [];
    this.checkMessage = checkAfterRun ? 'A megoldás futtatása és ellenőrzése...' : '';
    this.checkPassed = null;
    this.running = true;

    this.previewFrame.nativeElement.srcdoc = this.runner.buildPreviewDocument({
      projectId: this.project.id,
      token: this.runnerToken,
      html: this.htmlCode,
      css: this.cssCode,
      javascript: this.javascriptCode,
      darkMode: this.theme.isDark()
    });
  }

  checkProject(): void {
    if (!this.project || this.checking || this.isEditorLocked) return;

    if (!this.project.validation_configured) {
      this.checkPassed = false;
      this.checkMessage = 'Ehhez a projekthez az adminnak még be kell állítania az ellenőrzést.';
      return;
    }

    this.checking = true;
    this.runProject(true);
  }

  askMentor(): void {
    if (!this.project || this.running || this.isEditorLocked) return;

    this.mentorOpen = true;
    this.mentorAnalyzing = true;
    this.mentorTone = 'idle';
    this.mentorHint = 'Átnézem a futási eredményt és összevetem a projekt ellenőrzésével...';
    this.mentorSuggestions = [];
    this.runProject(false, true);
  }

  resetToStarter(): void {
    if (!this.project || this.isEditorLocked) return;
    if (!confirm('Visszaállítod a szerkesztőt az admin által megadott kezdőkódra?')) return;

    this.htmlCode = this.project.starter_html ?? '';
    this.cssCode = this.project.starter_css ?? '';
    this.javascriptCode = this.project.starter_javascript ?? '';
    this.consoleOutput = [];
    this.checkMessage = '';
    this.checkPassed = null;
    this.mentorTone = 'idle';
    this.mentorHint = 'A kezdőkód visszaállt. Futtasd, majd ha elakadsz, kérdezd meg a Mentort.';
    this.mentorSuggestions = [];
    this.runProject();
  }

  @HostListener('window:message', ['$event'])
  onRunnerMessage(event: MessageEvent<unknown>): void {
    const frameWindow = this.previewFrame?.nativeElement.contentWindow;
    if (!this.project || !frameWindow || event.source !== frameWindow || !this.runner.isRunnerMessage(event.data)) return;

    const message = event.data;
    if (message.token !== this.runnerToken || message.projectId !== this.project.id) return;

    this.consoleOutput = message.output;

    if (!message.done) return;

    this.running = false;

    if (this.pendingMentor) {
      this.pendingMentor = false;
      this.requestMentorAnalysis();
    }

    if (this.pendingCheck) {
      this.pendingCheck = false;
      this.sendCheck();
    }
  }

  validationLabel(): string {
    switch (this.project?.validation_type) {
      case 'html_contains': return 'Szerveroldali HTML-ellenőrzés';
      case 'css_contains': return 'Szerveroldali CSS-ellenőrzés';
      case 'javascript_contains': return 'Szerveroldali JavaScript-ellenőrzés';
      case 'source_contains': return 'Szerveroldali forrásellenőrzés';
      case 'console_contains': return 'Elvárt konzolsorok (visszajelzés)';
      default: return 'Pontos konzolkimenet (visszajelzés)';
    }
  }

  mentorIcon(): string {
    if (this.mentorTone === 'warning') return 'bi-exclamation-triangle-fill';
    if (this.mentorTone === 'success') return 'bi-check-circle-fill';
    if (this.mentorTone === 'tip') return 'bi-lightbulb-fill';
    return 'bi-stars';
  }

  private sendCheck(): void {
    if (!this.project) return;

    this.projectService.check(this.project.id, {
      ...this.workspacePayload(),
      console_output: this.consoleOutput
    }).subscribe({
      next: response => this.handleCheckResponse(response),
      error: error => {
        if (error?.status === 423) this.lockFromServer(error?.error);
        const validationMessage = error?.error?.errors?.project?.[0];
        this.checkPassed = false;
        this.checkMessage = validationMessage ?? error?.error?.message ?? 'Az ellenőrzés most nem sikerült.';
        this.checking = false;
      }
    });
  }

  private handleCheckResponse(response: ProjectCheckResponse): void {
    this.checkPassed = response.passed;
    this.checkMessage = response.message;
    this.checking = false;

    if (response.passed && this.project) {
      if (response.verified !== false) {
        this.project.is_completed = response.is_completed;
        if (response.is_completed) {
          this.project.is_expired = false;
          this.remainingSeconds = 0;
          this.stopCountdown();
        }
      }
      this.mentorOpen = true;
      this.mentorTone = response.verified === false ? 'tip' : 'success';
      this.mentorHint = response.verified === false
        ? 'A böngészős kimenet jónak tűnik, de biztonsági okból ez az ellenőrzéstípus nem igazol projekt-teljesítést és nem ad XP-t.'
        : response.already_completed
          ? 'A megoldás továbbra is átmegy az ellenőrzésen. Most már próbáld meg egyszerűsíteni vagy szebben strukturálni a kódot.'
          : 'Sikerült. Nézd meg, melyik gondolat volt a kulcs, mert ezt a mintát később más feladatoknál is használni fogod.';
      this.mentorSuggestions = [];
      return;
    }

    if (!response.passed) {
      this.mentorOpen = true;
      this.generateMentorHint(true);
    }
  }

  jumpToMentorFocus(): void {
    this.activeTab = this.mentorFocusTab;
    requestAnimationFrame(() => {
      document.querySelector('.editor-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  mentorFocusLabel(): string {
    if (this.mentorFocusTab === 'html') return 'HTML';
    if (this.mentorFocusTab === 'css') return 'CSS';
    if (this.mentorFocusTab === 'console') return 'Konzol';
    return 'JavaScript';
  }

  private requestMentorAnalysis(): void {
    if (!this.project) return;

    this.projectService.mentor(this.project.id, {
      ...this.workspacePayload(),
      console_output: this.consoleOutput
    }).subscribe({
      next: response => {
        this.mentorTier = response.tier;
        this.mentorTone = response.tone;
        this.mentorHint = response.summary;
        this.mentorSuggestions = response.suggestions;
        this.mentorFocusTab = response.focus_tab;
        this.mentorAnalyzing = false;
      },
      error: error => {
        if (error?.status === 423) this.lockFromServer(error?.error);
        this.mentorTier = this.auth.currentUser()?.is_premium ? 'pro' : 'standard';
        this.mentorSuggestions = [];
        this.mentorAnalyzing = false;
        this.generateMentorHint();
      }
    });
  }

  private generateMentorHint(validationFailed = false): void {
    const errorLine = this.consoleOutput.find(line => line.startsWith('HIBA:')) ?? '';
    const lowerError = errorLine.toLowerCase();
    const js = this.javascriptCode;
    const html = this.htmlCode;

    this.mentorOpen = true;

    if (!js.trim() && !html.trim()) {
      this.mentorTone = 'warning';
      this.mentorHint = 'A szerkesztő még üres. Indulj el a feladatleírás első konkrét lépésével, majd futtasd újra.';
      return;
    }

    if (lowerError.includes('is not defined')) {
      this.mentorTone = 'warning';
      this.mentorHint = 'A JavaScript egy olyan névre hivatkozik, amit nem talál. Ellenőrizd, hogy a változót létrehoztad-e a használata előtt, és pontosan ugyanúgy írtad-e a nevét.';
      return;
    }

    if (lowerError.includes('assignment to constant variable')) {
      this.mentorTone = 'warning';
      this.mentorHint = 'Egy const változónak új értéket próbálsz adni. Ha a feladat szerint később módosítani kell az értéket, gondold át, hogy inkább let legyen-e.';
      return;
    }

    if (
      lowerError.includes('unexpected token') ||
      lowerError.includes('unexpected end') ||
      lowerError.includes('missing') ||
      lowerError.includes('syntax')
    ) {
      this.mentorTone = 'warning';
      this.mentorHint = 'Szintaktikai hibának tűnik. Nézd végig a zárójeleket, idézőjeleket és kapcsos zárójeleket azon a részen, amit legutóbb módosítottál.';
      return;
    }

    if (lowerError.includes('cannot read properties of null') || lowerError.includes('cannot read property')) {
      this.mentorTone = 'warning';
      this.mentorHint = 'A kód valószínűleg olyan HTML-elemet keres, amit nem talált meg. Ellenőrizd az id/class nevet és azt, hogy az elem valóban szerepel-e a HTML-ben.';
      return;
    }

    if (errorLine) {
      this.mentorTone = 'warning';
      this.mentorHint = `A futás hibát jelzett: „${errorLine.replace(/^HIBA:\s*/i, '')}”. A hibaüzenet kulcsszavait keresd meg abban a sorban, amelyet legutóbb módosítottál.`;
      return;
    }

    if (!js.includes('console.log') && this.project?.validation_type?.startsWith('console')) {
      this.mentorTone = 'tip';
      this.mentorHint = 'Ez a projekt konzolkimenetet ellenőriz, de a JavaScriptben nem látok console.log() hívást. Nézd meg, mely értékeket kér kiírni a feladat.';
      return;
    }

    if (validationFailed) {
      this.mentorTone = 'tip';
      this.mentorHint = 'A program lefutott, tehát most inkább logikai eltérés van. Ellenőrizd a kiírt értékek sorrendjét, a felesleges console.log() sorokat és azt, hogy minden kért módosítás megtörtént-e.';
      return;
    }

    if (this.consoleOutput.length > 0) {
      this.mentorTone = 'success';
      this.mentorHint = 'A kód hibamentesen lefutott. Ha az ellenőrzés mégsem sikerül, a következő lépés a kimenet sorrendjének és a feladat pontos követelményeinek összevetése.';
      return;
    }

    this.mentorTone = 'tip';
    this.mentorHint = 'Nem látok futási hibát, de konzolkimenet sincs. Menj végig a feladaton lépésenként, és minden fontos köztes értéket írj ki ideiglenesen a konzolra.';
  }

  private workspacePayload(): ProjectWorkspacePayload {
    return {
      html_code: this.htmlCode,
      css_code: this.cssCode,
      javascript_code: this.javascriptCode
    };
  }

  private syncCountdown(): void {
    this.stopCountdown();
    if (!this.project || this.project.is_completed || !this.project.expires_at) {
      this.remainingSeconds = 0;
      return;
    }

    const update = () => {
      if (!this.project?.expires_at || this.project.is_completed) return;
      const remaining = Math.max(0, Math.floor((new Date(this.project.expires_at).getTime() - Date.now()) / 1000));
      this.remainingSeconds = remaining;
      this.project.remaining_seconds = remaining;
      if (remaining <= 0) {
        this.project.is_expired = true;
        this.stopCountdown();
        this.checkPassed = false;
        this.checkMessage = 'Lejárt a projektre rendelkezésre álló idő. A szerkesztő zárolva lett.';
      }
    };

    update();
    if (!this.project.is_expired) this.countdownTimer = setInterval(update, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
  }

  private lockFromServer(payload: Partial<ProjectTimingResponse> | null | undefined): void {
    if (!this.project) return;
    if (typeof payload?.timer_started === 'boolean') this.project.timer_started = payload.timer_started;
    this.project.is_expired = true;
    this.project.remaining_seconds = 0;
    if (payload?.expires_at) this.project.expires_at = payload.expires_at;
    this.remainingSeconds = 0;
    this.stopCountdown();
  }

  private applyTiming(payload: Partial<ProjectTimingResponse>): void {
    if (!this.project) return;
    if (typeof payload.timer_started === 'boolean') this.project.timer_started = payload.timer_started;
    if ('started_at' in payload) this.project.started_at = payload.started_at ?? null;
    if ('expires_at' in payload) this.project.expires_at = payload.expires_at ?? null;
    if (typeof payload.remaining_seconds === 'number') this.project.remaining_seconds = payload.remaining_seconds;
    if (typeof payload.is_expired === 'boolean') this.project.is_expired = payload.is_expired;
    this.syncCountdown();
  }

  private renderStaticPreview(): void {
    if (!this.project || !this.previewFrame) return;
    this.previewFrame.nativeElement.srcdoc = this.runner.buildPreviewDocument({
      projectId: this.project.id,
      token: 'preview-only',
      html: this.htmlCode,
      css: this.cssCode,
      javascript: this.javascriptCode,
      executeJavascript: false,
      darkMode: this.theme.isDark()
    });
  }

}
