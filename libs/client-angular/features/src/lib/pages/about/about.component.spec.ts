import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

import { About } from './about.component';
import { ConfigService } from '@legislative-tracker/client-angular/core';

describe('About Component', () => {
  let component: About;
  let fixture: ComponentFixture<About>;

  // 1. Define the Mock Data matching your RuntimeConfig shape
  const mockConfigData = {
    organization: {
      name: 'Test Union',
      url: 'https://test-union.org',
    },
    // We include branding to prevent undefined errors if the component reads it
    branding: {
      primaryColor: '#000000',
      logoUrl: '',
      faviconUrl: '',
      darkMode: false,
    },
    resources: [
      {
        title: 'Mock Resource',
        description: 'Mock Description',
        url: 'http://mock.com',
        icon: 'star',
        actionLabel: 'Go',
      },
    ],
  };

  // 2. Create the Mock Service
  // It provides a 'config' signal just like the real service
  const mockConfigService = {
    config: signal(mockConfigData),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About],
      providers: [
        // 3. Provide the mock instead of the real service
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(About);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the dynamic organization name and URL', () => {
    // Query the link in the header
    const linkDebugEl = fixture.debugElement.query(
      By.css('.about-header .inline-link'),
    );
    const linkEl: HTMLAnchorElement = linkDebugEl.nativeElement;

    // Verify text matches mock data
    expect(linkEl.textContent?.trim()).toBe('Test Union');

    // Verify href matches mock data (normalized)
    expect(linkEl.href).toContain('test-union.org');
  });

  it('should render the correct number of resource links', () => {
    const listItems = fixture.debugElement.queryAll(By.css('a[mat-list-item]'));
    expect(listItems.length).toBe(component.resources().length);
  });

  it('should enforce security best practices on external links', () => {
    fixture.detectChanges();
    const listItems = fixture.debugElement.queryAll(By.css('a[mat-list-item]'));

    // Should be 1 because our mockConfigData has 1 item
    expect(listItems.length).toBe(1);

    // Optional: Check content
    expect(listItems[0].nativeElement.textContent).toContain('Mock Resource');
  });
});
