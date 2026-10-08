import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../core/models/project.model';
import { ProjectService } from '../../services/project';

@Component({
  selector: 'app-projects',
  imports: [RouterLink],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class Projects implements OnInit, OnDestroy {
  projects: Project[] = [];
  loading = true;
  error = '';
  now = Date.now();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.projectService.getAll().subscribe({
      next: projects => {
        this.projects = projects;
        this.loading = false;
        this.timer = setInterval(() => this.now = Date.now(), 1000);
      },
      error: () => {
        this.error = 'A projektek most nem tölthetők be.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  difficultyLabel(value: string): string {
    const normalized = value.toLowerCase();
    if (normalized.includes('haladó')) return 'Haladó';
    if (normalized.includes('közep')) return 'Közepes';
    return 'Kezdő';
  }

  isExpired(project: Project): boolean {
    if (project.is_completed) return false;
    if (project.is_expired) return true;
    return !!project.expires_at && new Date(project.expires_at).getTime() <= this.now;
  }

  countdown(project: Project): string {
    if (project.is_completed) return 'Kész';
    if (!project.timer_started || !project.expires_at) return `${project.estimated_time} perc`;
    const seconds = Math.max(0, Math.floor((new Date(project.expires_at).getTime() - this.now) / 1000));
    if (seconds <= 0) return 'Lejárt';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(rest).padStart(2, '0');
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  }
}
