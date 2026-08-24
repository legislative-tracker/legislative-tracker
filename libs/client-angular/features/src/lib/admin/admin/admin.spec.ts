import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

import { Admin } from './admin';
import { ConfigService } from '@legislative-tracker/client-angular/core';
import { RuntimeConfig } from '@legislative-tracker/shared/models';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CdkDragDrop } from '@angular/cdk/drag-drop';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;
  let configServiceSpy: any;
  let snackBarSpy: any;

  const mockConfigData: RuntimeConfig = {
    organization: { name: 'Test Org', url: 'http://test.com' },
    branding: {
      primaryColor: '#000000',
      logoUrl: 'logo.png',
      faviconUrl: 'favicon.ico',
      darkMode: false,
    },
    resources: [
      {
        title: 'Resource A',
        url: 'http://a.com',
        description: '',
        icon: 'link',
        actionLabel: 'Go',
      },
      {
        title: 'Resource B',
        url: 'http://b.com',
        description: '',
        icon: 'link',
        actionLabel: 'Go',
      },
    ],
  };

  beforeEach(async () => {
    // 1. Define Mocks
    const mockConfigService = {
      config: signal({ ...mockConfigData }),
      save: vi.fn().mockResolvedValue(undefined),
    };

    const mockSnackBar = {
      open: vi.fn(),
    };

    // 2. Configure TestBed
    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    // 3. Create Component & Inject Spies
    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;

    // Retrieve the mocks from TestBed to ensure we have the correct handles
    configServiceSpy = TestBed.inject(ConfigService);
    snackBarSpy = TestBed.inject(MatSnackBar);

    // 4. FORCE the component to use our mock Snack Bar
    // (This fixes the injection mismatch causing "0 calls")
    (component as any).snackBar = snackBarSpy;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with config data via effect', () => {
    const resources = component.resourcesArray;
    expect(component.form.get('organization.name')?.value).toBe('Test Org');
    expect(resources.length).toBe(2);
    expect(resources.at(0).value.title).toBe('Resource A');
  });

  it('should add a new resource', () => {
    const initialLen = component.resourcesArray.length;
    component.addResource();
    expect(component.resourcesArray.length).toBe(initialLen + 1);
    expect(component.form.dirty).toBe(true);
  });

  it('should remove a resource', () => {
    component.removeResource(0);
    expect(component.resourcesArray.length).toBe(1);
    expect(component.form.dirty).toBe(true);
  });

  it('should reorder resources on drop', () => {
    const mockDropEvent = {
      previousIndex: 0,
      currentIndex: 1,
    } as CdkDragDrop<any[]>;

    component.drop(mockDropEvent);

    expect(component.resourcesArray.at(0).value.title).toBe('Resource B');
    expect(component.resourcesArray.at(1).value.title).toBe('Resource A');
    expect(component.form.dirty).toBe(true);
  });

  it('should save full configuration', async () => {
    // 1. Ensure form is valid by patching required fields
    component.form.patchValue({
      organization: { name: 'Updated Org', url: 'http://valid.com' },
      branding: { primaryColor: '#ffffff', logoUrl: 'assets/logo.png' },
    });

    // 2. Call save
    await component.saveConfig();

    // 3. Assertions
    expect(component.isSaving()).toBe(false);
    expect(configServiceSpy.save).toHaveBeenCalled();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      expect.stringContaining('saved successfully'),
      expect.any(String),
      expect.any(Object),
    );

    const capturedArgs = configServiceSpy.save.mock.calls[0][0];
    expect(capturedArgs.organization.name).toBe('Updated Org');
  });

  it('should handle save errors gracefully', async () => {
    // 1. Ensure form is valid so it attempts to save
    component.form.patchValue({
      organization: { name: 'Valid Org', url: 'http://valid.com' },
      branding: { primaryColor: '#ffffff', logoUrl: 'assets/logo.png' },
    });

    // 2. Mock the rejection
    configServiceSpy.save.mockRejectedValueOnce(new Error('Save failed'));

    // 3. Call save
    await component.saveConfig();

    // 4. Assertions
    expect(component.isSaving()).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      expect.stringContaining('Error saving'),
      'Close',
      expect.objectContaining({ panelClass: 'error-snack' }),
    );
  });

  it('should reset form to original config', () => {
    component.removeResource(0);
    component.form.patchValue({ organization: { name: 'Changed Name' } });

    component.resetForm();

    expect(component.form.get('organization.name')?.value).toBe('Test Org');
    expect(component.resourcesArray.length).toBe(2);
  });

  it('should configure routerLinks properly for all admin action buttons', () => {
    const linkDebugElements = fixture.debugElement.queryAll(
      By.directive(RouterLink),
    );
    expect(linkDebugElements.length).toBe(6);

    const hrefs = linkDebugElements.map((de) =>
      de.nativeElement.getAttribute('href'),
    );

    expect(hrefs).toContain('/admin/manualUpdate');
    expect(hrefs).toContain('/admin/removeBill');
    expect(hrefs).toContain('/admin/editBill');
    expect(hrefs).toContain('/admin/addBill');
    expect(hrefs).toContain('/admin/removeAdmin');
    expect(hrefs).toContain('/admin/addAdmin');
  });
});
