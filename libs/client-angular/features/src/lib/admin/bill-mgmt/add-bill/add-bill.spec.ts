import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Target Component
import { AddBill } from "./add-bill";

// Dependencies
import {
  AuthService,
  LegislatureService,
} from "@legislative-tracker/client-angular/core";

describe("AddBill", () => {
  let component: AddBill;
  let fixture: ComponentFixture<AddBill>;

  // Mock Dependencies
  const mockLegislatureService = {
    addBill: vi.fn(),
  };

  const mockSnackBar = {
    open: vi.fn(),
  };

  // Mock AuthService signals to prevent template errors (e.g. auth.isAdmin())
  const mockAuthService = {
    isAdmin: vi.fn().mockReturnValue(true),
    userProfile: vi.fn().mockReturnValue({ displayName: "Admin" }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBill], // Standalone
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      // Remove the real module so the component uses our mock provider
      .overrideComponent(AddBill, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AddBill);
    component = fixture.componentInstance;

    // Reset mocks
    vi.clearAllMocks();

    // Spy on console.error
    vi.spyOn(console, "error").mockImplementation(() => {});

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("onSubmit", () => {
    it("should return early if billId is empty", async () => {
      // Setup invalid state
      component.state = "ny";
      component.billId = ""; // Empty

      // Call method
      await component.onSubmit();

      // Verify no action taken
      expect(mockLegislatureService.addBill).not.toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it("should add bill, show success snackbar, and reset form on success", async () => {
      // Setup valid state
      component.state = "ny";
      component.billId = "S1234";

      mockLegislatureService.addBill.mockResolvedValue({ success: true });

      // Call method
      await component.onSubmit();

      // Verify Service Call
      // Expect the object structure defined in your component
      expect(mockLegislatureService.addBill).toHaveBeenCalledWith(
        "ny",
        expect.objectContaining({
          id: "S1234",
          updatedAt: expect.any(String), // Verify timestamp was generated
        }),
      );

      // Verify Success Feedback
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining("Success"),
        "Close",
        expect.objectContaining({ panelClass: ["success-snackbar"] }),
      );

      // Verify Form Reset
      expect(component.state).toBe("");
      expect(component.billId).toBe("");
      expect(component.isLoading()).toBe(false);
    });

    it("should show error snackbar if service fails", async () => {
      // Setup Error State
      component.state = "ca";
      component.billId = "AB100";

      const errorMsg = "Database Error";
      mockLegislatureService.addBill.mockRejectedValue(new Error(errorMsg));

      // Call method
      await component.onSubmit();

      // Verify Error Handling
      expect(mockLegislatureService.addBill).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled(); // Logged

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        errorMsg,
        "Close",
        expect.objectContaining({ panelClass: ["error-snackbar"] }),
      );

      // Verify Form NOT reset (so user can retry)
      expect(component.state).toBe("ca");
      expect(component.billId).toBe("AB100");
      expect(component.isLoading()).toBe(false);
    });
  });
});
