import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Directive, Input } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

// Target Component
import { MemberDetail } from './member-detail';

// Dependencies
import { LegislatureService } from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';
import { ImgFallbackDirective } from '@legislative-tracker/client-angular/ui';
import { Legislator } from '@legislative-tracker/shared/models';

// -------------------------------------------------------------------------
// Create Stubs for Children (Isolation)
// -------------------------------------------------------------------------

// Stub for TableComponent to avoid table dependencies
@Component({
  selector: 'app-table',
  template: '',
  standalone: true,
  inputs: ['dataSource', 'columnSource'],
})
class MockTableComponent {}

// Stub for Directive to avoid needing the real file
@Directive({
  selector: 'img[appImgFallback]',
  standalone: true,
  inputs: ['appImgFallback'],
})
class MockImgFallbackDirective {}

describe('MemberDetail', () => {
  let component: MemberDetail;
  let fixture: ComponentFixture<MemberDetail>;

  // Mock Data
  const mockLegislator: Legislator = {
    id: '123',
    name: 'Jane Doe',
    chamber: 'SENATE',
    district: '123',
    honorific_prefix: 'Senator',
    party: 'Democratic',
    sponsorships: [
      { id: 'BILL-1', title: 'Clean Energy Act', version: '' },
      { id: 'BILL-2', title: 'Road Safety Act', version: 'A' },
    ],
  };

  // Mock Service
  const mockLegislatureService = {
    getMemberById: vi.fn().mockReturnValue(of(mockLegislator)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberDetail], // Standalone
      providers: [
        provideNoopAnimations(), // For MatTabs/Spinner
        { provide: LegislatureService, useValue: mockLegislatureService },
      ],
    })
      // Override Child Components/Directives
      .overrideComponent(MemberDetail, {
        remove: { imports: [TableComponent, ImgFallbackDirective] },
        add: { imports: [MockTableComponent, MockImgFallbackDirective] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MemberDetail);
    component = fixture.componentInstance;

    // Initialize Required Inputs (Signals)
    fixture.componentRef.setInput('stateCd', 'ny');
    fixture.componentRef.setInput('id', '123');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getMemberById with correct params on initialization', () => {
    // rxResource triggers automatically when inputs are stable
    expect(mockLegislatureService.getMemberById).toHaveBeenCalledWith('ny', '123');
  });

  it('should update member signal when resource resolves', () => {
    // Verify the computed member() signal holds the data
    const memberData = component.member();

    expect(memberData).toBeDefined();
    expect(memberData?.name).toBe('Jane Doe');
    expect(memberData?.chamber).toBe('SENATE');
    expect(memberData?.district).toBe('123');
    expect(memberData?.party).toBe('Democratic');
    expect(memberData?.honorific_prefix).toBe('Senator');
  });

  it('should compute sponsorships correctly', () => {
    // Verify the computed sponsorships() signal
    const sponsorships = component.sponsorships();

    expect(sponsorships.length).toBe(2);
    expect(sponsorships[0].title).toBe('Clean Energy Act');
  });

  it('should default sponsorships to empty array if member is undefined', () => {
    // Simulate a scenario where service returns null/undefined
    mockLegislatureService.getMemberById.mockReturnValueOnce(of(null));

    // Force a refresh (change input ID to trigger new resource fetch)
    fixture.componentRef.setInput('id', '999');
    fixture.detectChanges();

    expect(component.member()).toBeFalsy();
    expect(component.sponsorships()).toEqual([]);
  });

  it('should refetch data when inputs change', () => {
    // Clear previous calls
    mockLegislatureService.getMemberById.mockClear();

    // Change inputs
    fixture.componentRef.setInput('stateCd', 'ca');
    fixture.componentRef.setInput('id', '456');
    fixture.detectChanges();

    // Verify service was called with NEW params
    expect(mockLegislatureService.getMemberById).toHaveBeenCalledWith('ca', '456');
  });
});
