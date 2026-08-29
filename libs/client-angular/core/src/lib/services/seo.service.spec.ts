import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let titleServiceMock: { setTitle: ReturnType<typeof vi.fn> };
  let metaServiceMock: {
    updateTag: ReturnType<typeof vi.fn>;
    removeTag: ReturnType<typeof vi.fn>;
  };
  let doc: Document;

  beforeEach(() => {
    titleServiceMock = {
      setTitle: vi.fn(),
    };
    metaServiceMock = {
      updateTag: vi.fn(),
      removeTag: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { provide: Title, useValue: titleServiceMock },
        { provide: Meta, useValue: metaServiceMock },
      ],
    });

    service = TestBed.inject(SeoService);
    doc = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    // Clean up any injected canonical or json-ld elements
    const link = doc.querySelector("link[rel='canonical']");
    if (link && link.parentNode) {
      link.parentNode.removeChild(link);
    }
    const script = doc.querySelector("script[type='application/ld+json']");
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update title and open graph / twitter tags with provided config', () => {
    service.updateTags({
      title: 'S1234: Clean Water Act',
      description: 'A bill establishing clean water initiatives.',
      image: 'https://example.com/water.png',
      url: 'https://tracker.example.com/us-ny/bill/1234',
      type: 'article',
      twitterCard: 'summary_large_image',
    });

    expect(titleServiceMock.setTitle).toHaveBeenCalledWith(
      'S1234: Clean Water Act | Legislative Tracker',
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        name: 'description',
        content: 'A bill establishing clean water initiatives.',
      },
      "name='description'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        property: 'og:title',
        content: 'S1234: Clean Water Act | Legislative Tracker',
      },
      "property='og:title'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        property: 'og:description',
        content: 'A bill establishing clean water initiatives.',
      },
      "property='og:description'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      { property: 'og:type', content: 'article' },
      "property='og:type'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        property: 'og:url',
        content: 'https://tracker.example.com/us-ny/bill/1234',
      },
      "property='og:url'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        property: 'og:image',
        content: 'https://example.com/water.png',
      },
      "property='og:image'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      { name: 'twitter:card', content: 'summary_large_image' },
      "name='twitter:card'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        name: 'twitter:title',
        content: 'S1234: Clean Water Act | Legislative Tracker',
      },
      "name='twitter:title'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        name: 'twitter:description',
        content: 'A bill establishing clean water initiatives.',
      },
      "name='twitter:description'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        name: 'twitter:image',
        content: 'https://example.com/water.png',
      },
      "name='twitter:image'",
    );

    const canonicalLink = doc.querySelector("link[rel='canonical']");
    expect(canonicalLink).toBeTruthy();
    expect(canonicalLink?.getAttribute('href')).toBe(
      'https://tracker.example.com/us-ny/bill/1234',
    );
  });

  it('should remove image tags and canonical link when no url or image is provided', () => {
    service.updateTags({
      title: 'Member Profile',
      description: 'Profile for Jane Doe',
    });

    expect(metaServiceMock.removeTag).toHaveBeenCalledWith(
      "property='og:image'",
    );
    expect(metaServiceMock.removeTag).toHaveBeenCalledWith(
      "name='twitter:image'",
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      { name: 'twitter:card', content: 'summary' },
      "name='twitter:card'",
    );
  });

  it('should inject and remove Schema.org JSON-LD structured data', () => {
    const jsonLdPayload = {
      '@context': 'https://schema.org',
      '@type': 'Legislation',
      name: 'S100: Clean Energy Bill',
    };

    service.updateTags({
      title: 'S100: Clean Energy Bill',
      jsonLd: jsonLdPayload,
    });

    const script = doc.querySelector("script[type='application/ld+json']");
    expect(script).toBeTruthy();
    expect(script?.textContent).toBe(JSON.stringify(jsonLdPayload));

    service.resetTags();
    const scriptAfterReset = doc.querySelector(
      "script[type='application/ld+json']",
    );
    expect(scriptAfterReset).toBeNull();
  });

  it('should reset tags to default values', () => {
    service.resetTags();

    expect(titleServiceMock.setTitle).toHaveBeenCalledWith(
      service.defaultTitle,
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      { name: 'description', content: service.defaultDescription },
      "name='description'",
    );
  });

  it('should set bill tags with identifier and JSON-LD schema', () => {
    service.setBillTags({
      identifier: 'A 10360',
      title: 'Broadband Expansion',
      description: 'Relates to broadband programs.',
      url: 'https://tracker.example.com/us-ny/bill/A10360',
      stateCd: 'us-ny',
    });

    expect(titleServiceMock.setTitle).toHaveBeenCalledWith(
      'A 10360 | Legislative Tracker',
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        property: 'og:title',
        content: 'A 10360 | Legislative Tracker',
      },
      "property='og:title'",
    );

    const script = doc.querySelector("script[type='application/ld+json']");
    expect(script).toBeTruthy();
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed['@type']).toBe('Legislation');
    expect(parsed.legislationIdentifier).toBe('A 10360');
    expect(parsed.spatialCoverage).toBe('us-ny');
  });

  it('should set member tags with member details and JSON-LD Person schema', () => {
    service.setMemberTags({
      name: 'Jane Doe',
      details: 'Senator, Democratic, District 23',
      image: 'https://example.com/headshot.jpg',
      url: 'https://tracker.example.com/us-ny/member/123',
    });

    expect(titleServiceMock.setTitle).toHaveBeenCalledWith(
      'Jane Doe | Legislative Tracker',
    );
    expect(metaServiceMock.updateTag).toHaveBeenCalledWith(
      {
        name: 'description',
        content:
          'Jane Doe (Senator, Democratic, District 23) - Legislative Tracker member profile and sponsored legislation.',
      },
      "name='description'",
    );

    const script = doc.querySelector("script[type='application/ld+json']");
    expect(script).toBeTruthy();
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed['@type']).toBe('Person');
    expect(parsed.name).toBe('Jane Doe');
    expect(parsed.image).toBe('https://example.com/headshot.jpg');
    expect(parsed.jobTitle).toBe('Senator, Democratic, District 23');
  });

  it('should set legislation tags with Legislation schema', () => {
    service.setLegislationTags({
      name: 'Clean Water Initiative',
      description: 'Clean water legislation.',
      url: 'https://tracker.example.com/us-ny/legislation/clean-water',
    });

    expect(titleServiceMock.setTitle).toHaveBeenCalledWith(
      'Clean Water Initiative | Legislative Tracker',
    );
    const script = doc.querySelector("script[type='application/ld+json']");
    expect(script).toBeTruthy();
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed['@type']).toBe('Legislation');
    expect(parsed.name).toBe('Clean Water Initiative');
  });
});
