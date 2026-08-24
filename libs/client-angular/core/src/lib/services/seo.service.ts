import { Injectable, inject } from '@angular/core';
import { Title, Meta, MetaDefinition } from '@angular/platform-browser';

export interface SeoTagsConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  readonly defaultTitle = 'Legislative Tracker';
  readonly defaultDescription =
    'Track state legislation, bills, and elected officials.';

  updateTags(config: SeoTagsConfig): void {
    const title = config.title
      ? config.title.includes('Legislative Tracker')
        ? config.title
        : `${config.title} | Legislative Tracker`
      : this.defaultTitle;

    const description = config.description || this.defaultDescription;
    const type = config.type || 'website';
    const card =
      config.twitterCard || (config.image ? 'summary_large_image' : 'summary');
    const url =
      config.url ||
      (typeof window !== 'undefined' && window.location
        ? window.location.href
        : '');

    this.titleService.setTitle(title);

    // Standard description
    this.updateOrRemoveTag({ name: 'description', content: description });

    // OpenGraph
    this.updateOrRemoveTag({ property: 'og:title', content: title });
    this.updateOrRemoveTag({
      property: 'og:description',
      content: description,
    });
    this.updateOrRemoveTag({ property: 'og:type', content: type });
    if (url) {
      this.updateOrRemoveTag({ property: 'og:url', content: url });
    }
    if (config.image) {
      this.updateOrRemoveTag({ property: 'og:image', content: config.image });
    } else {
      this.metaService.removeTag("property='og:image'");
    }

    // Twitter
    this.updateOrRemoveTag({ name: 'twitter:card', content: card });
    this.updateOrRemoveTag({ name: 'twitter:title', content: title });
    this.updateOrRemoveTag({
      name: 'twitter:description',
      content: description,
    });
    if (config.image) {
      this.updateOrRemoveTag({
        name: 'twitter:image',
        content: config.image,
      });
    } else {
      this.metaService.removeTag("name='twitter:image'");
    }
  }

  resetTags(): void {
    this.updateTags({
      title: this.defaultTitle,
      description: this.defaultDescription,
      type: 'website',
      twitterCard: 'summary',
    });
  }

  private updateOrRemoveTag(tag: MetaDefinition): void {
    const selector = tag.name
      ? `name='${tag.name}'`
      : `property='${tag.property}'`;

    if (tag.content) {
      this.metaService.updateTag(tag, selector);
    } else {
      this.metaService.removeTag(selector);
    }
  }
}
