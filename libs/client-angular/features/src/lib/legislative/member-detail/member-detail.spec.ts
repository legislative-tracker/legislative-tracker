import {
  Component,
  Directive,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Title } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

// Target Component
import { MemberDetail } from './member-detail';

// Dependencies
import {
  LegislatureService,
  SeoService,
} from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';
import { ImgFallbackDirective } from '@legislative-tracker/client-angular/ui';
import { OpenStatesPerson } from '@legislative-tracker/shared/models';

// Stubs
@Component({
  selector: 'app-table',
  template: '',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['dataSource', 'columnSource'],
})
class MockTableComponent {}

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
  const mockLegislator: OpenStatesPerson = {
    id: '123',
    name: 'Jane Doe',
    party: 'Democratic',
    image: 'https://example.com/janedoe.jpg',
    current_role: {
      title: 'Senator',
      org_classification: 'upper',
      district: '123',
      division_id: 'ocd-division/country:us/state:ny/sldu:123',
    },
    sponsorships: [
      {
        legislationId: 'LEG-1',
        ocdBillId: 'BILL-1',
        stateBillId: 'S100',
        billName: 'Clean Energy Act',
      },
      {
        legislationId: 'LEG-2',
        ocdBillId: 'BILL-2',
        stateBillId: 'S200',
        billName: 'Road Safety Act',
      },
    ],
    other_identifiers: [
      { scheme: 'twitter', identifier: 'janedoe' },
      { scheme: 'facebook', identifier: 'janedoe.official' },
      { scheme: 'unknown', identifier: 'ignored' },
    ],
  };

  const mockLegislatureService = {
    getMemberById: vi.fn().mockReturnValue(of(mockLegislator)),
  };

  const mockSeoService = {
    updateTags: vi.fn(),
    resetTags: vi.fn(),
  };

  beforeEach(async () => {
    mockSeoService.updateTags.mockClear();
    mockSeoService.resetTags.mockClear();

    await TestBed.configureTestingModule({
      imports: [MemberDetail],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: SeoService, useValue: mockSeoService },
      ],
    })
      .overrideComponent(MemberDetail, {
        remove: { imports: [TableComponent, ImgFallbackDirective] },
        add: { imports: [MockTableComponent, MockImgFallbackDirective] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MemberDetail);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('stateCd', 'ny');
    fixture.componentRef.setInput('id', '123');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getMemberById with correct params on initialization', () => {
    expect(mockLegislatureService.getMemberById).toHaveBeenCalledWith(
      'ny',
      '123',
    );
  });

  it('should update member signal when resource resolves', () => {
    const memberData = component.member();

    expect(memberData).toBeDefined();
    expect(memberData?.name).toBe('Jane Doe');
    expect(component.district()).toBe('123');
    expect(memberData?.party).toBe('Democratic');
    expect(component.titleOrPrefix()).toBe('Senator');
  });

  it('should update the SEO tags and title for member', () => {
    expect(mockSeoService.updateTags).toHaveBeenCalledWith({
      title: 'Jane Doe | Legislative Tracker',
      description:
        'Jane Doe (Senator, Democratic, District 123) - Legislative Tracker member profile and sponsored legislation.',
      image: 'https://example.com/janedoe.jpg',
      type: 'profile',
      twitterCard: 'summary_large_image',
    });
  });

  it('should compute sponsorships correctly', () => {
    const sponsorships = component.sponsorships();

    expect(sponsorships.length).toBe(2);
    expect(sponsorships[0].billName).toBe('Clean Energy Act');
  });

  it('should compute socialLinks correctly from other_identifiers', () => {
    const socialLinks = component.socialLinks();

    expect(socialLinks.length).toBe(2);
    expect(socialLinks[0]).toEqual({
      platform: 'twitter',
      username: 'janedoe',
      url: 'https://x.com/janedoe',
      icon: 'fa-brands fa-x-twitter',
    });
    expect(socialLinks[1]).toEqual({
      platform: 'facebook',
      username: 'janedoe.official',
      url: 'https://facebook.com/janedoe.official',
      icon: 'fa-brands fa-facebook',
    });
  });

  it('should default sponsorships and socialLinks to empty array if member is undefined', () => {
    mockLegislatureService.getMemberById.mockReturnValueOnce(of(null));

    fixture.componentRef.setInput('id', '999');
    fixture.detectChanges();

    expect(component.member()).toBeFalsy();
    expect(component.sponsorships()).toEqual([]);
    expect(component.socialLinks()).toEqual([]);
  });

  it('should refetch data when inputs change', () => {
    mockLegislatureService.getMemberById.mockClear();

    fixture.componentRef.setInput('stateCd', 'ca');
    fixture.componentRef.setInput('id', '456');
    fixture.detectChanges();

    expect(mockLegislatureService.getMemberById).toHaveBeenCalledWith(
      'ca',
      '456',
    );
  });
});
