import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    this.titleService.setTitle(routeTitle ? `${routeTitle} | Getingo` : 'Getingo – Tanulj webfejlesztést gyakorlatban');

    let route = snapshot.root;
    let description = 'Tanulj webfejlesztést interaktív leckékkel, kvízekkel és valódi gyakorlóprojektekkel a Getingón.';
    let robots = 'index,follow';
    while (route.firstChild) {
      route = route.firstChild;
      description = route.data['seoDescription'] ?? description;
      robots = route.data['seoRobots'] ?? robots;
    }

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ property: 'og:title', content: this.titleService.getTitle() });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }
}
