import {
  Component,
  DebugElement,
  ChangeDetectionStrategy,
} from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgFallbackDirective } from './img-fallback.directive';

@Component({
  standalone: true,
  imports: [ImgFallbackDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img id="default-img" src="broken-link.jpg" appFallback />

    <img
      id="custom-img"
      src="broken-link-2.jpg"
      [appFallback]="customFallback"
    />
  `,
})
class TestHostComponent {
  customFallback = '/assets/custom-placeholder.png';
}

describe('ImgFallbackDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let defaultImg: DebugElement;
  let customImg: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ImgFallbackDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    defaultImg = fixture.debugElement.query(By.css('#default-img'));
    customImg = fixture.debugElement.query(By.css('#custom-img'));
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should apply the DEFAULT fallback when the image fails to load', () => {
    const imgEl = defaultImg.nativeElement as HTMLImageElement;

    defaultImg.triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    expect(imgEl.src).toContain('account_circle_40.svg');
    expect(imgEl.classList.contains('is-placeholder')).toBe(true);
  });

  it('should apply a CUSTOM fallback if provided via input', () => {
    const imgEl = customImg.nativeElement as HTMLImageElement;

    customImg.triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    expect(imgEl.src).toContain('custom-placeholder.png');
    expect(imgEl.classList.contains('is-placeholder')).toBe(true);
  });

  it('should remove "srcset" attribute to prevent browser confusion', () => {
    const imgEl = defaultImg.nativeElement as HTMLImageElement;

    imgEl.setAttribute('srcset', 'large.jpg 1000w, small.jpg 500w');
    expect(imgEl.getAttribute('srcset')).toBeTruthy();

    defaultImg.triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    expect(imgEl.getAttribute('srcset')).toBeNull();
  });

  it('should prevent infinite loops if the fallback image ITSELF fails', () => {
    const imgEl = defaultImg.nativeElement as HTMLImageElement;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    imgEl.src = '/assets/account_circle_40.svg';

    defaultImg.triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Critical: Fallback image is missing'),
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });
});
