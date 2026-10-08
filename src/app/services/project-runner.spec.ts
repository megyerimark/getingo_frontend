import { TestBed } from '@angular/core/testing';
import { ProjectRunnerService } from './project-runner';

describe('ProjectRunnerService', () => {
  let service: ProjectRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectRunnerService);
  });

  it('detects obvious infinite loops without flagging strings and comments', () => {
    expect(service.hasObviousInfiniteLoop('while (true) { console.log("x"); }')).toBeTrue();
    expect(service.hasObviousInfiniteLoop('for (;;) {}')).toBeTrue();
    expect(service.hasObviousInfiniteLoop('// while(true)\nconsole.log("while(true)")')).toBeFalse();
  });

  it('builds a sandbox document with network access disabled by CSP', () => {
    const html = service.buildPreviewDocument({
      projectId: 12,
      token: 'test-token',
      html: '<h1>Hello</h1>',
      css: 'h1{color:red}',
      javascript: 'console.log("ok")'
    });

    expect(html).toContain("default-src 'none'");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("base-uri 'none'");
    expect(html).toContain("script-src 'nonce-test-token'");
    expect(html).toContain('<script nonce="test-token">');
    expect(html).not.toContain("script-src 'unsafe-inline'");
    expect(html).toContain('test-token');
  });

  it('validates runner message shape', () => {
    expect(service.isRunnerMessage({ source: 'getingo-project-runner', token: 'a', projectId: 1, output: ['ok'], done: true })).toBeTrue();
    expect(service.isRunnerMessage({ source: 'evil', token: 'a', projectId: 1, output: [], done: true })).toBeFalse();
  });
});
