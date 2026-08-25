import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';
import { Privacy } from './privacy.component';

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

  it('should render full description for all categories', () => {
    fixture.detectChanges();
    const categories = component.dataCategories();
    const listItems = fixture.debugElement.queryAll(By.css('mat-list-item'));

    expect(listItems.length).toBe(categories.length);

    listItems.forEach((itemEl, idx) => {
      const category = categories[idx];
      const descEl = itemEl.query(By.css('.category-desc'));
      expect(descEl).toBeTruthy();
      expect(descEl.nativeElement.textContent).toContain(category.description);

      // Verify no restrictive lines attribute is set on mat-list-item
      expect(itemEl.nativeElement.getAttribute('lines')).toBeNull();

      if (category.importantNote) {
        const noteEl = itemEl.query(By.css('.highlight-note'));
        expect(noteEl).toBeTruthy();
        expect(noteEl.nativeElement.textContent).toContain(
          category.importantNote,
        );
      }
    });
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
