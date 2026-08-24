import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { App } from './app.component';
import { ConfigService } from '@legislative-tracker/client-angular/core';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  // Mock ConfigService
  // matches the structure seen in your previous config.service.ts
  const mockConfigService = {
    config: signal({
      branding: {
        logoUrl: 'assets/mock-logo.png',
        primaryColor: '#000000',
        faviconUrl: 'favicon.ico',
      },
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App], // Standalone component
      providers: [
        //  Necessary because the template contains <router-outlet>
        provideRouter([]),

        // Provide the mock service
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize config property from ConfigService', () => {
    // Access the protected property for testing purposes
    const appConfig = (component as any).config;

    // Verify it references the signal from the service
    expect(appConfig).toBeDefined();
    expect(appConfig().branding.logoUrl).toBe('assets/mock-logo.png');
  });
});
