import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta, MetaDefinition } from '@angular/platform-browser';

/**
 * Options for configuring SEO, OpenGraph, and Twitter card metadata tags.
 */
export interface SeoTagsConfig {
  /** Page title string (automatically suffixed with '| Legislative Tracker'). */
  title?: string;
  /** Meta description summary text. */
  description?: string;
  /** OpenGraph and Twitter image preview URL. */
  image?: string;
  /** Canonical page URL. */
  url?: string;
  /** OpenGraph type (e.g., 'website', 'article', 'profile'). */
  type?: string;
  /** Twitter card display layout. */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  /** Schema.org JSON-LD structured data payload. */
  jsonLd?: Record<string, unknown>;
}

/**
 * Service managing document titles and meta tags for search engines,
 * social media link unfurling (OpenGraph), Twitter cards, canonical tags,
 * and Schema.org JSON-LD structured data.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);

  /** Default document title. */
  readonly defaultTitle = 'Legislative Tracker';
  /** Default meta description. */
  readonly defaultDescription =
    'Track state legislation, bills, and elected officials.';

  /**
   * Updates page title, canonical tag, OpenGraph/Twitter meta tags, and JSON-LD.
   *
   * @param config - Target SEO metadata configuration.
   */
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

    // Canonical link tag
    this.updateCanonicalUrl(url);

    // Schema.org JSON-LD
    this.updateJsonLd(config.jsonLd);
  }

  /**
   * Resets all metadata tags back to the application defaults.
   */
  resetTags(): void {
    this.updateTags({
      title: this.defaultTitle,
      description: this.defaultDescription,
      type: 'website',
      twitterCard: 'summary',
    });
  }

  /**
   * Configures SEO metadata tailored for an individual bill detail view.
   */
  setBillTags(options: {
    identifier?: string;
    title?: string;
    description?: string;
    url?: string;
    session?: string;
    stateCd?: string;
  }): void {
    const pageTitle = options.identifier || options.title || 'Bill Details';
    const description =
      options.description || options.title || 'View bill details and actions.';
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Legislation',
      name: options.identifier
        ? `${options.identifier}: ${options.title || pageTitle}`
        : pageTitle,
      description,
      ...(options.identifier
        ? { legislationIdentifier: options.identifier }
        : {}),
      ...(options.url ? { url: options.url } : {}),
      ...(options.stateCd ? { spatialCoverage: options.stateCd } : {}),
    };

    this.updateTags({
      title: pageTitle,
      description,
      type: 'article',
      twitterCard: 'summary',
      url: options.url,
      jsonLd,
    });
  }

  /**
   * Configures SEO metadata tailored for an elected member/legislator profile.
   */
  setMemberTags(options: {
    name: string;
    details?: string;
    image?: string;
    url?: string;
  }): void {
    const description = options.details
      ? `${options.name} (${options.details}) - Legislative Tracker member profile and sponsored legislation.`
      : `${options.name} - Legislative Tracker member profile and sponsored legislation.`;
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: options.name,
      description,
      ...(options.image ? { image: options.image } : {}),
      ...(options.url ? { url: options.url } : {}),
      ...(options.details ? { jobTitle: options.details } : {}),
    };

    this.updateTags({
      title: options.name,
      description,
      image: options.image,
      type: 'profile',
      twitterCard: options.image ? 'summary_large_image' : 'summary',
      url: options.url,
      jsonLd,
    });
  }

  /**
   * Configures SEO metadata tailored for a tracked legislation view.
   */
  setLegislationTags(options: {
    name: string;
    description?: string;
    url?: string;
  }): void {
    const description =
      options.description ||
      `${options.name} legislation details and chambers.`;
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Legislation',
      name: options.name,
      description,
      ...(options.url ? { url: options.url } : {}),
    };

    this.updateTags({
      title: options.name,
      description,
      type: 'article',
      twitterCard: 'summary',
      url: options.url,
      jsonLd,
    });
  }

  /**
   * Updates or removes a meta tag definition.
   */
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

  /**
   * Updates or creates the `<link rel="canonical" href="...">` element in the document head.
   */
  private updateCanonicalUrl(url?: string): void {
    if (!this.document) return;
    const head =
      this.document.head || this.document.getElementsByTagName('head')[0];
    let link: HTMLLinkElement | null = this.document.querySelector(
      "link[rel='canonical']",
    );

    if (url) {
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'canonical');
        head?.appendChild(link);
      }
      link.setAttribute('href', url);
    } else if (link && head) {
      head.removeChild(link);
    }
  }

  /**
   * Updates or creates the `<script type="application/ld+json">` element in the document head.
   */
  private updateJsonLd(data?: Record<string, unknown>): void {
    if (!this.document) return;
    const head =
      this.document.head || this.document.getElementsByTagName('head')[0];
    let script: HTMLScriptElement | null = this.document.querySelector(
      "script[type='application/ld+json']",
    );

    if (data) {
      if (!script) {
        script = this.document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        head?.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    } else if (script && head) {
      head.removeChild(script);
    }
  }
}
