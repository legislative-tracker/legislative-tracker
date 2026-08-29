import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';
import { Terms } from './terms.component';

describe('Terms Component', () => {
  let component: Terms;
  let fixture: ComponentFixture<Terms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Terms],
    }).compileComponents();

    fixture = TestBed.createComponent(Terms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render terms sections', () => {
    fixture.detectChanges();
    const listItems = fixture.debugElement.queryAll(By.css('mat-list-item'));
    expect(listItems.length).toBe(component.termsSections().length);
  });

  it('should display non-affiliation disclaimer note', () => {
    fixture.detectChanges();
    const notes = fixture.debugElement.queryAll(By.css('.highlight-note'));
    expect(notes.length).toBeGreaterThan(0);
    const disclaimer = notes.find((n) =>
      n.nativeElement.textContent.includes('informational'),
    );
    expect(disclaimer).toBeTruthy();
  });

  it('should have secure external links with noopener and noreferrer', () => {
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
