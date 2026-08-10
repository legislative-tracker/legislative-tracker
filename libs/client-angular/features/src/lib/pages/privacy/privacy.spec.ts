import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';
import { Privacy } from './privacy';

describe('Privacy Component', () => {
  let component: Privacy;
  let fixture: ComponentFixture<Privacy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Privacy],
    }).compileComponents();

    fixture = TestBed.createComponent(Privacy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the data collection categories', () => {
    fixture.detectChanges();
    const listItems = fixture.debugElement.queryAll(By.css('mat-list-item'));
    expect(listItems.length).toBe(component.dataCategories().length);
  });

  it('should highlight the transient address warning', () => {
    fixture.detectChanges();

    const warningEl = fixture.debugElement.query(By.css('.highlight-note'));

    expect(warningEl).toBeTruthy();
    expect(warningEl.nativeElement.textContent).toContain('We do NOT store');
  });

  it('should have secure external links', () => {
    const links = fixture.debugElement.queryAll(By.css('a[href^="http"]'));
    links.forEach((linkDebugEl) => {
      const el = linkDebugEl.nativeElement as HTMLAnchorElement;
      if (el.target === '_blank') {
        expect(el.rel).toContain('noopener');
        expect(el.rel).toContain('noreferrer');
      }
    });
  });
});
