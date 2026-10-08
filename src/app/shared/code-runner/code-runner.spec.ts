import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CodeRunner } from './code-runner';

describe('CodeRunner', () => {
  let component: CodeRunner;
  let fixture: ComponentFixture<CodeRunner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeRunner],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeRunner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
