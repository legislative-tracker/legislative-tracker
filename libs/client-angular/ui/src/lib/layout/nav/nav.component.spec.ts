import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { Router, provideRouter } from "@angular/router";
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState,
} from "@angular/cdk/layout";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { BehaviorSubject } from "rxjs";
import { signal } from "@angular/core";

// Target Component
import { NavComponent } from "./nav.component";
import { Footer } from "../footer/footer"; // Import the real footer class so we can reference it

// Service Dependencies
import {
  AuthService,
  ConfigService,
} from "@legislative-tracker/client-angular/core";

// Create a Dummy Footer
@Component({
  selector: "app-footer",
  template: "",
  standalone: true,
})
class MockFooter {}

describe("NavComponent", () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let router: Router;

  // Mock Services
  const mockAuthService = {
    logout: vi.fn().mockResolvedValue(undefined),
    isLoggedIn: vi.fn().mockReturnValue(true),
    isAdmin: vi.fn().mockReturnValue(true),
    isAnnon: vi.fn().mockReturnValue(false),
    currentUser: signal({ displayName: "Test User" }),
  };

  const mockConfigService = {
    config: signal({
      branding: {
        logoUrl: "/assets/logo.png",
        primaryColor: "#003366",
        faviconUrl: "/assets/favicon.ico",
      },
    }),
  };

  // Mock Breakpoint Observer with a Subject for live updates
  const screenState$ = new BehaviorSubject<BreakpointState>({
    matches: false,
    breakpoints: {},
  });
  const mockBreakpointObserver = {
    observe: vi.fn().mockReturnValue(screenState$.asObservable()),
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
    vi.spyOn(router, "navigate");

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Responsive Behavior", () => {
    it("should identify Handset mode correctly", () => {
      // Simulate Mobile (Handset)
      screenState$.next({ matches: true, breakpoints: {} });

      // Capture the value
      let result: boolean | undefined;
      component.isHandset$.subscribe((val) => (result = val));

      // Assert
      expect(result).toBe(true);
    });

    it("should identify Desktop mode correctly", () => {
      // Simulate Desktop
      screenState$.next({ matches: false, breakpoints: {} });

      let result: boolean | undefined;
      component.isHandset$.subscribe((val) => (result = val));

      expect(result).toBe(false);
    });
  });

  describe("Authentication", () => {
    it("should log out and navigate to login on handleLogout", async () => {
      await component.handleLogout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(["/login"]);
    });
  });

  describe("Configuration", () => {
    it("should load branding from ConfigService", () => {
      const protectedComponent = component as any;
      expect(protectedComponent.config().branding.logoUrl).toBe(
        "/assets/logo.png",
      );
    });
  });
});
