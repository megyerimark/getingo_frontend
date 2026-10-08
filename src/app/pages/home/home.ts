import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Category } from '../../core/models/category.model';
import { HomeLesson, HomeService } from '../../services/home';
import { CodeRunner } from '../../shared/code-runner/code-runner';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, CodeRunner],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  categories: Category[] = [];
  latestLessons: HomeLesson[] = [];
  loading = true;
  lessonsLoading = true;
  search = new FormControl('', { nonNullable: true });

  readonly demoHtml = '<h1>Szia, Getingo!</h1>\n<p>Ez az első weboldalam.</p>';
  readonly demoCss = 'body { font-family: system-ui; }\nh1 { color: #1677ff; }';
  readonly demoJavascript = "console.log('Kód fut!');";

  constructor(
    private homeService: HomeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.homeService.getHome().subscribe({
      next: response => {
        this.categories = response.categories;
        this.latestLessons = response.latest_lessons;
        this.loading = false;
        this.lessonsLoading = false;
      },
      error: () => {
        this.loading = false;
        this.lessonsLoading = false;
      }
    });
  }

  searchContent(): void {
    const query = this.search.value.trim();
    if (query.length < 2) return;
    this.router.navigate(['/search'], { queryParams: { q: query } });
  }

  searchCategory(category: Category): void {
    this.search.setValue(category.name);
    this.searchContent();
  }

  categoryShort(category: Category): string {
    const value = category.name.trim().toLowerCase();
    if (value.includes('javascript')) return 'JS';
    if (value.includes('html')) return 'HTML';
    if (value.includes('css')) return 'CSS';
    if (value.includes('angular')) return 'A';
    if (value.includes('laravel')) return 'L';
    return category.name.slice(0, 2).toUpperCase();
  }

  categoryTone(category: Category): string {
    const value = `${category.name} ${category.slug}`.toLowerCase();
    if (value.includes('javascript')) return 'javascript';
    if (value.includes('html')) return 'html';
    if (value.includes('css')) return 'css';
    if (value.includes('angular')) return 'angular';
    if (value.includes('laravel')) return 'laravel';
    return 'default';
  }

  lessonExcerpt(lesson: HomeLesson): string {
    return lesson.excerpt;
  }
}
