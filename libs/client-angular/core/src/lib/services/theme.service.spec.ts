import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

const mockArgbFromHex = vi.fn();
const mockThemeFromSourceColor = vi.fn();
const mockHexFromArgb = vi.fn();

vi.mock('@material/material-color-utilities', () => ({
  argbFromHex: (...args: any[]) => mockArgbFromHex(...args),
  themeFromSourceColor: (...args: any[]) => mockThemeFromSourceColor(...args),
  hexFromArgb: (...args: any[]) => mockHexFromArgb(...args),
}));

describe('ThemeService', () => {
  let service: ThemeService;
  let documentMock: Document;
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();

    documentMock = document;
    documentMock.documentElement.className = '';
    documentMock.documentElement.style.colorScheme = '';
    vi.spyOn(documentMock.documentElement.style, 'setProperty');

    mockArgbFromHex.mockReturnValue(12345);
    mockHexFromArgb.mockReturnValue('#000000');
    mockThemeFromSourceColor.mockReturnValue({
      schemes: {
        light: { toJSON: () => ({ primary: 0xff0000 }) },
        dark: { toJSON: () => ({ primary: 0x00ff00 }) },
      },
    });

    documentMock = document;
    vi.spyOn(documentMock.documentElement.style, 'setProperty');

    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia as any;

    TestBed.configureTestingModule({
      providers: [ThemeService, { provide: DOCUMENT, useValue: documentMock }],
    });

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created with default mode "system"', () => {
    expect(service).toBeTruthy();
    expect(service.mode()).toBe('system');
    expect(service.isDarkMode()).toBe(false);
  });

  it('should load initial mode from localStorage if present', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const freshService = TestBed.runInInjectionContext(
      () => new ThemeService(),
    );
    expect(freshService.mode()).toBe('dark');
    expect(freshService.isDarkMode()).toBe(true);
  });

  it('should update mode and save to localStorage on setThemeMode', () => {
    service.setThemeMode('dark');
    expect(service.mode()).toBe('dark');
    expect(service.isDarkMode()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.setThemeMode('light');
    expect(service.mode()).toBe('light');
    expect(service.isDarkMode()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    service.setThemeMode('system');
    expect(service.mode()).toBe('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('should apply dark theme classes and properties when dark mode is active', async () => {
    await service.applyTheme('#673ab7', true);

    expect(documentMock.documentElement.classList.contains('dark-theme')).toBe(
      true,
    );
    expect(documentMock.documentElement.style.colorScheme).toBe('dark');
    expect(documentMock.documentElement.style.setProperty).toHaveBeenCalled();
  });

  it('should apply light theme classes and properties when light mode is active', async () => {
    await service.applyTheme('#673ab7', false);

    expect(documentMock.documentElement.classList.contains('dark-theme')).toBe(
      false,
    );
    expect(documentMock.documentElement.style.colorScheme).toBe('light');
    expect(documentMock.documentElement.style.setProperty).toHaveBeenCalled();
  });

  it('should react when systemIsDark updates in system mode', () => {
    service.setThemeMode('system');
    expect(service.isDarkMode()).toBe(false);

    service.systemIsDark.set(true);
    expect(service.isDarkMode()).toBe(true);

    service.systemIsDark.set(false);
    expect(service.isDarkMode()).toBe(false);
  });

  it('should allow setting primary color', () => {
    service.setPrimaryColor('#123456');
    expect(service.currentPrimaryColor()).toBe('#123456');
  });
});
