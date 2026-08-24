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

import { MemberDetail } from './member-detail.component';

// Dependencies
import {
  AuthService,
  LegislatureService,
  SeoService,
} from '@legislative-tracker/client-angular/core';
import { TableComponent } from '@legislative-tracker/client-angular/ui';
import { ImgFallbackDirective } from '@legislative-tracker/client-angular/ui';
import { OpenStatesPerson } from '@legislative-tracker/shared/models';
import { signal } from '@angular/core';

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
    email: 'jdoe@senate.example.gov',
    image: 'https://example.com/janedoe.jpg',
    current_role: {
      title: 'Senator',
      org_classification: 'upper',
      district: '123',
      division_id: 'ocd-division/country:us/state:ny/sldu:123',
    },
    offices: [
      {
        name: 'Capitol Office',
        voice: '(518) 555-0100',
        address: 'Room 412, Capitol Building, Albany, NY',
      },
      {
        name: 'District Office',
        voice: '(212) 555-0200',
        address: '100 Broadway, New York, NY',
      },
    ],
    links: [
      { url: 'https://janedoe.senate.gov', note: 'Official Site' },
      { url: 'https://instagram.com/janedoe_ny', note: 'Instagram' },
      { url: 'https://bsky.app/profile/janedoe.bsky.social', note: 'Bluesky' },
    ],
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

  const mockUserProfileSignal = signal<any>(null);
  const mockAuthService = {
    userProfile: mockUserProfileSignal,
  };

  beforeEach(async () => {
    mockSeoService.updateTags.mockClear();
    mockSeoService.resetTags.mockClear();
    mockUserProfileSignal.set(null);

    await TestBed.configureTestingModule({
      imports: [MemberDetail],
      providers: [
        provideNoopAnimations(),
        { provide: LegislatureService, useValue: mockLegislatureService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: AuthService, useValue: mockAuthService },
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

  it('should compute socialLinks correctly from other_identifiers and links array', () => {
    const socialLinks = component.socialLinks();

    expect(socialLinks.length).toBe(4);
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
    expect(socialLinks[2]).toEqual({
      platform: 'instagram',
      username: 'janedoe_ny',
      url: 'https://instagram.com/janedoe_ny',
      icon: 'fa-brands fa-instagram',
    });
    expect(socialLinks[3]).toEqual({
      platform: 'bluesky',
      username: 'janedoe.bsky.social',
      url: 'https://bsky.app/profile/janedoe.bsky.social',
      icon: 'fa-brands fa-bluesky',
    });
  });

  it('should compute click-to-call phone shortcuts from offices', () => {
    const phones = component.phones();

    expect(phones.length).toBe(2);
    expect(phones[0]).toEqual({
      label: 'Capitol Office: (518) 555-0100',
      number: '(518) 555-0100',
      telUrl: 'tel:5185550100',
      officeName: 'Capitol Office',
    });
    expect(phones[1]).toEqual({
      label: 'District Office: (212) 555-0200',
      number: '(212) 555-0200',
      telUrl: 'tel:2125550200',
      officeName: 'District Office',
    });
  });

  it('should compute primaryEmail, officialWebsiteUrl (.gov), and openStatesUrl correctly', () => {
    expect(component.primaryEmail()).toBe('jdoe@senate.example.gov');
    expect(component.officialWebsiteUrl()).toBe('https://janedoe.senate.gov');
    expect(component.websiteUrl()).toBe('https://janedoe.senate.gov');
  });

  it('should only set officialWebsiteUrl for .gov URLs and identify OpenStates profiles', () => {
    const nonGovMember: OpenStatesPerson = {
      id: '456',
      name: 'John NonGov',
      openstates_url: 'https://openstates.org/person/john-nongov-456',
      links: [
        { url: 'https://johnnongov.com', note: 'Campaign Site' },
        {
          url: 'https://openstates.org/person/john-nongov-456',
          note: 'OpenStates Profile',
        },
      ],
    };

    mockLegislatureService.getMemberById.mockReturnValueOnce(of(nonGovMember));
    fixture.componentRef.setInput('id', '456');
    fixture.detectChanges();

    expect(component.officialWebsiteUrl()).toBeUndefined();
    expect(component.generalWebsiteUrl()).toBe('https://johnnongov.com');
    expect(component.openStatesUrl()).toBe(
      'https://openstates.org/person/john-nongov-456',
    );
  });

  it('should compute userRepLabel when member matches user representative', () => {
    mockUserProfileSignal.set({
      legislators: {
        state: [
          {
            id: '123',
            name: 'Jane Doe',
            chamber: 'Senate',
            district: '123',
          },
        ],
        federal: [],
      },
    });

    expect(component.userRepLabel()).toBe('Your State Senator');
  });

  it('should compute userRepLabel based on profile.districts (e.g. State Senate District 24)', () => {
    const district24Member: OpenStatesPerson = {
      id: 'lanza-24',
      name: 'Andrew J. Lanza',
      current_role: {
        district: '24',
        title: 'Senator',
        org_classification: 'upper',
      },
    };

    mockLegislatureService.getMemberById.mockReturnValueOnce(
      of(district24Member),
    );
    fixture.componentRef.setInput('id', 'lanza-24');
    fixture.detectChanges();

    mockUserProfileSignal.set({
      districts: {
        state: {
          senate: '24',
          assembly: '64',
        },
        federal: '11',
      },
    });

    expect(component.userRepLabel()).toBe('Your State Senator');
  });

  it('should default sponsorships, phones, and socialLinks to empty array if member is undefined', () => {
    mockLegislatureService.getMemberById.mockReturnValueOnce(of(null));

    fixture.componentRef.setInput('id', '999');
    fixture.detectChanges();

    expect(component.member()).toBeFalsy();
    expect(component.sponsorships()).toEqual([]);
    expect(component.phones()).toEqual([]);
    expect(component.socialLinks()).toEqual([]);
    expect(component.websiteUrl()).toBeUndefined();
    expect(component.primaryEmail()).toBeUndefined();
    expect(component.userRepLabel()).toBeUndefined();
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
