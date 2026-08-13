import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { FirebaseApp } from '@angular/fire/app';
import { Firestore } from '@angular/fire/firestore';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { ConfigService } from './config.service';
import { FirebaseConfigService } from '../adapters/firebase-config.service';

const mockDocData = vi.fn();
const mockDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockGetFirestore = vi.fn().mockReturnValue({});

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  getFirestore: (...args: any[]) => mockGetFirestore(...args),
  doc: (...args: any[]) => mockDoc(...args),
  docData: (...args: any[]) => mockDocData(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
}));

const mockArgbFromHex = vi.fn();
const mockThemeFromSourceColor = vi.fn();
const mockHexFromArgb = vi.fn();

vi.mock('@material/material-color-utilities', () => ({
  argbFromHex: (...args: any[]) => mockArgbFromHex(...args),
  themeFromSourceColor: (...args: any[]) => mockThemeFromSourceColor(...args),
  hexFromArgb: (...args: any[]) => mockHexFromArgb(...args),
}));

describe('FirebaseConfigService', () => {
  let service: ConfigService;
  let documentMock: Document;

  const mockFirebaseApp = { name: '[DEFAULT]' };
  const mockFirestore = {};

  beforeEach(() => {
    vi.resetAllMocks();

    mockGetFirestore.mockReturnValue({});
    mockDoc.mockReturnValue({ path: 'configurations/global' });
    mockSetDoc.mockResolvedValue(void 0);

    mockThemeFromSourceColor.mockReturnValue({
      schemes: { light: { toJSON: () => ({}) } },
    });
    mockArgbFromHex.mockReturnValue(0);
    mockHexFromArgb.mockReturnValue('#000000');

    documentMock = document;
    vi.spyOn(documentMock, 'querySelector');
    vi.spyOn(documentMock, 'createElement');
    vi.spyOn(documentMock.head, 'appendChild');
    vi.spyOn(documentMock.documentElement.style, 'setProperty');

    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useClass: FirebaseConfigService },
        { provide: FirebaseApp, useValue: mockFirebaseApp },
        { provide: Firestore, useValue: mockFirestore },
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
    expect(current.branding.primaryColor).toBe('#673ab7');
  });

  describe('load()', () => {
    it('should fetch remote config and merge both organization and branding', async () => {
      const remoteConfig = {
        organization: { name: 'Test Org', url: 'https://test.com' },
        branding: { primaryColor: '#ff0000' },
      };
      mockDocData.mockReturnValue(of(remoteConfig));

      await service.load();

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'configurations/global',
      );

      const updated = service.config();
      expect(updated.organization.name).toBe('Test Org');
      expect(updated.branding.primaryColor).toBe('#ff0000');
      expect(updated.branding.logoUrl).toContain('assets/default_logo.png');
    });

    it('should use defaults if Firestore fails', async () => {
      mockDocData.mockReturnValue(
        throwError(() => new Error('Permission Denied')),
      );
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

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        newConfig,
        { merge: true },
      );

      const current = service.config();
      expect(current.organization.name).toBe('Updated Org');
    });

    it('should throw error if Firestore save fails', async () => {
      mockSetDoc.mockRejectedValue(new Error('Write Failed'));
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const newConfig = { branding: { primaryColor: '#000000' } };

      await expect(service.save(newConfig as any)).rejects.toThrow(
        'Write Failed',
      );
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
      const mockTheme = {
        schemes: { light: { toJSON: () => ({ primary: 0xff0000 }) } },
      };
      mockThemeFromSourceColor.mockReturnValue(mockTheme);
      mockHexFromArgb.mockReturnValue('#ff0000');

      const newConfig = {
        branding: { primaryColor: '#ff0000' },
      };
      mockDocData.mockReturnValue(of(newConfig));

      await service.load();
      await TestBed.flushEffects();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockArgbFromHex).toHaveBeenCalledWith('#ff0000');
      expect(
        documentMock.documentElement.style.setProperty,
      ).toHaveBeenCalledWith('--mat-sys-color-primary', '#ff0000');
    });
  });
});
