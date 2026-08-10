import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { FirebaseApp } from '@angular/fire/app';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { ConfigService } from './config.service';

// -------------------------------------------------------------------------
// Mock Dynamic Imports
// -------------------------------------------------------------------------

// --- Firestore Mocks ---
const mockDocData = vi.fn();
const mockDoc = vi.fn();
const mockSetDoc = vi.fn(); // <--- NEW: Mock for saving
const mockGetFirestore = vi.fn().mockReturnValue({});

vi.mock('@angular/fire/firestore', () => ({
  getFirestore: (...args: any[]) => mockGetFirestore(...args),
  doc: (...args: any[]) => mockDoc(...args),
  docData: (...args: any[]) => mockDocData(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args), // <--- NEW: Register mock
}));

// --- Material Color Utilities Mocks ---
const mockArgbFromHex = vi.fn();
const mockThemeFromSourceColor = vi.fn();
const mockHexFromArgb = vi.fn();

vi.mock('@material/material-color-utilities', () => ({
  argbFromHex: (...args: any[]) => mockArgbFromHex(...args),
  themeFromSourceColor: (...args: any[]) => mockThemeFromSourceColor(...args),
  hexFromArgb: (...args: any[]) => mockHexFromArgb(...args),
}));

describe('ConfigService', () => {
  let service: ConfigService;
  let documentMock: Document;

  const mockFirebaseApp = { name: '[DEFAULT]' };

  beforeEach(() => {
    // ⚠️ RESET MOCKS
    vi.resetAllMocks();

    // --- Fix: Ensure mocks return objects, not undefined ---
    mockGetFirestore.mockReturnValue({});
    mockDoc.mockReturnValue({ path: 'configurations/global' }); // <--- ADD THIS
    mockSetDoc.mockResolvedValue(void 0); // Simulate successful promise

    // Material Color Mocks
    mockThemeFromSourceColor.mockReturnValue({ schemes: { light: { toJSON: () => ({}) } } });
    mockArgbFromHex.mockReturnValue(0);
    mockHexFromArgb.mockReturnValue('#000000');

    // Mock Document
    documentMock = document;
    vi.spyOn(documentMock, 'querySelector');
    vi.spyOn(documentMock, 'createElement');
    vi.spyOn(documentMock.head, 'appendChild');
    vi.spyOn(documentMock.documentElement.style, 'setProperty');

    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        { provide: FirebaseApp, useValue: mockFirebaseApp },
        { provide: DOCUMENT, useValue: documentMock },
      ],
    });

    service = TestBed.inject(ConfigService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created with default configuration', () => {
    expect(service).toBeTruthy();
    const current = service.config();
    // Assuming defaults from your RuntimeConfig
    expect(current.branding.primaryColor).toBe('#673ab7');
  });

  describe('load()', () => {
    it('should fetch remote config and merge both organization and branding', async () => {
      const remoteConfig = {
        organization: { name: 'Test Org', url: 'https://test.com' },
        branding: { primaryColor: '#ff0000' }, // Partial branding
      };
      mockDocData.mockReturnValue(of(remoteConfig));

      await service.load();

      expect(mockGetFirestore).toHaveBeenCalledWith(mockFirebaseApp);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'configurations/global');

      const updated = service.config();

      // Verify Organization Update
      expect(updated.organization.name).toBe('Test Org');

      // Verify Branding Update
      expect(updated.branding.primaryColor).toBe('#ff0000');

      // Verify Merge Logic (Should preserve default fields not present in remoteConfig)
      // Assuming 'logoUrl' defaults to 'assets/default-logo.png' in your model
      expect(updated.branding.logoUrl).toContain('assets/default-logo.png');
    });

    it('should use defaults if Firestore fails', async () => {
      mockDocData.mockReturnValue(throwError(() => new Error('Permission Denied')));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.load();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Config fetch failed, using defaults.',
        expect.anything(),
      );

      const current = service.config();
      expect(current.branding.primaryColor).toBe('#673ab7');
    });
  });

  describe('save()', () => {
    it('should save to Firestore and update signal optimistically', async () => {
      const newConfig = {
        organization: { name: 'Updated Org', url: 'http://update.com' },
      };

      await service.save(newConfig as any);

      // Verify Firestore Call
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(), // The docRef
        newConfig,
        { merge: true },
      );

      // Verify Optimistic Signal Update
      const current = service.config();
      expect(current.organization.name).toBe('Updated Org');
    });

    it('should throw error if Firestore save fails', async () => {
      mockSetDoc.mockRejectedValue(new Error('Write Failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const newConfig = { branding: { primaryColor: '#000000' } };

      await expect(service.save(newConfig as any)).rejects.toThrow('Write Failed');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Effects (Favicon & Theme)', () => {
    it('should update favicon when config changes', async () => {
      const mockLink = document.createElement('link');
      vi.spyOn(documentMock, 'querySelector').mockReturnValue(mockLink);

      const newConfig = {
        branding: { faviconUrl: 'new-icon.ico' },
      };

      mockDocData.mockReturnValue(of(newConfig));
      await service.load();
      await TestBed.flushEffects();

      expect(mockLink.href).toContain('new-icon.ico');
    });

    it('should apply dynamic theme when primary color changes', async () => {
      mockArgbFromHex.mockReturnValue(12345);
      const mockTheme = { schemes: { light: { toJSON: () => ({ primary: 0xff0000 }) } } };
      mockThemeFromSourceColor.mockReturnValue(mockTheme);
      mockHexFromArgb.mockReturnValue('#ff0000');

      const newConfig = {
        branding: { primaryColor: '#ff0000' },
      };
      mockDocData.mockReturnValue(of(newConfig));

      await service.load();
      await TestBed.flushEffects();

      // Wait for async import inside effect
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockArgbFromHex).toHaveBeenCalledWith('#ff0000');
      expect(documentMock.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--mat-sys-color-primary',
        '#ff0000',
      );
    });
  });
});
