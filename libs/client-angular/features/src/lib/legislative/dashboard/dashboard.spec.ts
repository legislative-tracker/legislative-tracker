import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { of } from "rxjs";

// Target Component
import { Dashboard } from "./dashboard";

// Dependencies
import { LegislatureService } from "@legislative-tracker/client-angular/core";
import { TableComponent } from "@legislative-tracker/client-angular/ui";

// -------------------------------------------------------------------------
// Stub Child Components
// -------------------------------------------------------------------------
@Component({
  selector: "app-table",
  template: "",
  standalone: true,
  inputs: ["dataSource", "columnSource", "isLoading", "routeType"],
})
class MockTableComponent {}

describe("Dashboard", () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  // Mock Data
  const mockBills = [
    { id: "BILL-1", title: "Education Reform", session: "2024" },
    { id: "BILL-2", title: "Infrastructure", session: "2024" },
  ];

  const mockMembers = [
    { id: "1", name: "Jane Doe", chamber: "SENATE", party: "D" },
    { id: "2", name: "John Smith", chamber: "ASSEMBLY", party: "R" },
    { id: "3", name: "Alice Johnson", chamber: "SENATE", party: "I" },
  ];

  // Mock Service
  const mockLegislatureService = {
    getBillsByState: vi.fn().mockReturnValue(of(mockBills)),
    getMembersByState: vi.fn().mockReturnValue(of(mockMembers)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard], // Standalone
      providers: [
        provideNoopAnimations(), // Prevent MatTabs animation errors
        { provide: LegislatureService, useValue: mockLegislatureService },
      ],
    })
      // Override the real TableComponent with our Stub
      .overrideComponent(Dashboard, {
        remove: { imports: [TableComponent] },
        add: { imports: [MockTableComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;

    // Initialize Required Input
    fixture.componentRef.setInput("stateCd", "ny");

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Initialization (Default Tab: Bills)", () => {
    it("should fetch bills immediately on load", () => {
      // Logic: Tab 0 (Bills) is default -> billsRequest computes 'ny' -> API called
      expect(mockLegislatureService.getBillsByState).toHaveBeenCalledWith("ny");
      expect(component.bills()).toEqual(mockBills);
    });

    it("should NOT fetch members on initial load", () => {
      // Logic: Tab 0 -> membersRequest computes null -> API NOT called
      expect(mockLegislatureService.getMembersByState).not.toHaveBeenCalled();
      expect(component.members()).toEqual([]);
    });
  });

  describe("Tab Switching & Data Filtering", () => {
    // Make test async
    it("should fetch members when switching to Senate tab (Index 1)", async () => {
      // Switch Tab
      component.onTabChange(1);
      fixture.detectChanges();

      // Wait for the resource to process the new params and resolve
      await fixture.whenStable();

      // Verify API Call
      expect(mockLegislatureService.getMembersByState).toHaveBeenCalledWith(
        "ny",
      );

      // Verify Derived State
      const senate = component.senateMembers();
      expect(senate.length).toBe(2);
      expect(senate.find((m) => m.name === "Jane Doe")).toBeTruthy();
      expect(senate.find((m) => m.chamber === "ASSEMBLY")).toBeUndefined();
    });

    //: Make test async
    it("should fetch members when switching to Assembly tab (Index 2)", async () => {
      component.onTabChange(2);
      fixture.detectChanges();
      await fixture.whenStable(); // Wait for resource

      expect(mockLegislatureService.getMembersByState).toHaveBeenCalledWith(
        "ny",
      );

      const assembly = component.assemblyMembers();
      expect(assembly.length).toBe(1);
      expect(assembly[0].name).toBe("John Smith");
    });

    // Make test async
    it("should stop fetching bills when switching away from Bills tab", async () => {
      mockLegislatureService.getBillsByState.mockClear();

      component.onTabChange(1); // Switch to Senate
      fixture.detectChanges();
      await fixture.whenStable(); // Wait for resource to see null params

      // Ensure Bills API was NOT called again
      expect(mockLegislatureService.getBillsByState).not.toHaveBeenCalled();

      // The resource should now resolve to empty array because params became null
      expect(component.bills()).toEqual([]);
    });
  });

  describe("State Changes", () => {
    it("should refetch bills when stateCd input changes", () => {
      mockLegislatureService.getBillsByState.mockClear();

      // Change Input
      fixture.componentRef.setInput("stateCd", "ca");
      fixture.detectChanges();

      // Verify new call
      expect(mockLegislatureService.getBillsByState).toHaveBeenCalledWith("ca");
    });
  });
});
