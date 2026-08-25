import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter, NavigationEnd } from '@angular/router';
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState,
} from '@angular/cdk/layout';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';

// Target Component
import { NavComponent } from './nav.component';
import { Footer } from '../footer/footer.component'; // Import the real footer class so we can reference it

// Service Dependencies
import {
  AuthService,
  ConfigService,
  OfflineStorageService,
  ThemeService,
} from '@legislative-tracker/client-angular/core';

// Create a Dummy Footer
@Component({
  selector: 'app-footer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
class MockFooter {}

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let router: Router;

  const mockUserProfileSignal = signal<any>({
    displayName: 'Test User',
  });
  const mockAuthService = {
    logout: vi.fn().mockResolvedValue(undefined),
    isLoggedIn: vi.fn().mockReturnValue(true),
    isAdmin: vi.fn().mockReturnValue(true),
    isAnnon: vi.fn().mockReturnValue(false),
    currentUser: signal({ displayName: 'Test User' }),
    userProfile: mockUserProfileSignal,
  };

  const mockConfigService = {
    config: signal({
      branding: {
        logoUrl: '/assets/logo.png',
        primaryColor: '#003366',
        faviconUrl: '/assets/favicon.ico',
      },
    }),
  };

  const mockThemeService = {
    mode: signal('system'),
    isDarkMode: signal(false),
    setThemeMode: vi.fn(),
  };

  // Mock Breakpoint Observer with a Subject for live updates
  const screenState$ = new BehaviorSubject<BreakpointState>({
    matches: false,
    breakpoints: {},
  });
  const mockBreakpointObserver = {
    observe: vi.fn().mockReturnValue(screenState$.asObservable()),
    isMatched: vi.fn().mockReturnValue(false),
  };

  beforeEach(async () => {
    screenState$.next({ matches: false, breakpoints: {} });

    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
      ],
    })
      // Swap the real Footer for the Dummy
      // This prevents Footer's internal dependencies from crashing your test.
      .overrideComponent(NavComponent, {
        remove: { imports: [Footer] },
        add: { imports: [MockFooter] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Responsive Behavior', () => {
    it('should identify Handset mode correctly', () => {
      // Simulate Mobile (Handset)
      screenState$.next({ matches: true, breakpoints: {} });

      // Capture the value
      let result: boolean | undefined;
      component.isHandset$.subscribe((val) => (result = val));

      // Assert
      expect(result).toBe(true);
    });

    it('should identify Desktop mode correctly', () => {
      // Simulate Desktop
      screenState$.next({ matches: false, breakpoints: {} });

      let result: boolean | undefined;
      component.isHandset$.subscribe((val) => (result = val));
      expect(result).toBe(false);
    });
  });

  describe('Navigation Drawer', () => {
    it('should close drawer on nav item click in handset mode', () => {
      const mockDrawer = { close: vi.fn() } as any;

      const breakpointObserver = TestBed.inject(BreakpointObserver);
      vi.spyOn(breakpointObserver, 'isMatched').mockReturnValue(true);

      component.onNavItemClick(mockDrawer);
      expect(mockDrawer.close).toHaveBeenCalled();
    });

    it('should NOT close drawer on nav item click in desktop mode', () => {
      const mockDrawer = { close: vi.fn() } as any;

      const breakpointObserver = TestBed.inject(BreakpointObserver);
      vi.spyOn(breakpointObserver, 'isMatched').mockReturnValue(false);

      component.onNavItemClick(mockDrawer);
      expect(mockDrawer.close).not.toHaveBeenCalled();
    });

    it('should close drawer on logout in handset mode', async () => {
      const mockDrawer = { close: vi.fn() } as any;

      const breakpointObserver = TestBed.inject(BreakpointObserver);
      vi.spyOn(breakpointObserver, 'isMatched').mockReturnValue(true);

      await component.handleLogout(mockDrawer);
      expect(mockDrawer.close).toHaveBeenCalled();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Branding Configuration', () => {
    it('should expose config signal from ConfigService', () => {
      const protectedComponent = component as any;
      expect(protectedComponent.config).toBeDefined();
      expect(protectedComponent.config().branding.logoUrl).toBe(
        '/assets/logo.png',
      );
    });
  });

  describe('Theme Toggle', () => {
    it('should expose themeService', () => {
      expect(component.themeService).toBeDefined();
      expect(component.themeService.mode()).toBe('system');
    });
  });

  describe('Toolbar Bookmark Button', () => {
    it('should detect legislation route and target leg: prefix', () => {
      (router.events as any).next(
        new NavigationEnd(
          1,
          '/us-ny/legislation/clean-energy',
          '/us-ny/legislation/clean-energy',
        ),
      );
      fixture.detectChanges();

      const target = component.currentBookmarkTarget();
      expect(target).toEqual({
        type: 'legislation',
        id: 'clean-energy',
        key: 'leg:clean-energy',
        stateCd: 'us-ny',
      });
    });

    it('should detect ocd-bill route and target bill: prefix', () => {
      (router.events as any).next(
        new NavigationEnd(
          2,
          '/us-ny/ocd-bill/mock-bill-1',
          '/us-ny/ocd-bill/mock-bill-1',
        ),
      );
      fixture.detectChanges();

      const target = component.currentBookmarkTarget();
      expect(target).toEqual({
        type: 'bill',
        id: 'mock-bill-1',
        key: 'bill:mock-bill-1',
        stateCd: 'us-ny',
      });
    });

    it('should return null target on non-bookmarkable routes', () => {
      (router.events as any).next(new NavigationEnd(3, '/about', '/about'));
      fixture.detectChanges();

      expect(component.currentBookmarkTarget()).toBeNull();
    });

    it('should toggle offline save', async () => {
      const offlineStorage = TestBed.inject(OfflineStorageService);
      const saveSpy = vi.spyOn(offlineStorage, 'saveBill').mockResolvedValue();
      const removeSpy = vi
        .spyOn(offlineStorage, 'removeSavedBill')
        .mockResolvedValue();

      (router.events as any).next(
        new NavigationEnd(
          5,
          '/us-ny/ocd-bill/mock-bill-1',
          '/us-ny/ocd-bill/mock-bill-1',
        ),
      );
      fixture.detectChanges();

      component.isSavedOffline.set(false);
      await component.toggleOfflineSave();
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mock-bill-1',
          stateCd: 'us-ny',
          type: 'bill',
        }),
      );
      expect(component.isSavedOffline()).toBe(true);

      component.isSavedOffline.set(true);
      await component.toggleOfflineSave();
      expect(removeSpy).toHaveBeenCalledWith('mock-bill-1');
      expect(component.isSavedOffline()).toBe(false);
    });
  });
});
