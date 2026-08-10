import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ImgFallbackDirective } from './img-fallback';

// Create a Test Host Component
// We use this to "host" the directive in various configurations
@Component({
  standalone: true,
  imports: [ImgFallbackDirective],
  template: `
    <img id="default-img" src="broken-link.jpg" appFallback />

    <img id="custom-img" src="broken-link-2.jpg" [appFallback]="customFallback" />
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

    // Query elements for easy access
    defaultImg = fixture.debugElement.query(By.css('#default-img'));
    customImg = fixture.debugElement.query(By.css('#custom-img'));
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should apply the DEFAULT fallback when the image fails to load', () => {
    const imgEl = defaultImg.nativeElement as HTMLImageElement;

    // Trigger the error event
    defaultImg.triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    // Assert that src changed to the hardcoded default
    // Note: checking 'includes' is safer than strict equality due to absolute paths
    expect(imgEl.src).toContain('account_circle_40.svg');

    // Assert the class was added
    expect(imgEl.classList.contains('is-placeholder')).toBe(true);
  });

  it('should apply a CUSTOM fallback if provided via input', () => {
    const imgEl = customImg.nativeElement as HTMLImageElement;

    // Trigger error
    customImg.triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    // Assert src is the custom one
    expect(imgEl.src).toContain('custom-placeholder.png');
    expect(imgEl.classList.contains('is-placeholder')).toBe(true);
  });

  it('should remove "srcset" attribute to prevent browser confusion', () => {
    const imgEl = defaultImg.nativeElement as HTMLImageElement;

    // Manually add a srcset to simulate a responsive image
    imgEl.setAttribute('srcset', 'large.jpg 1000w, small.jpg 500w');
    expect(imgEl.getAttribute('srcset')).toBeTruthy();

    // Trigger error
    defaultImg.triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    // Assert it was wiped
    expect(imgEl.getAttribute('srcset')).toBeNull();
  });

  it('should prevent infinite loops if the fallback image ITSELF fails', () => {
    const imgEl = defaultImg.nativeElement as HTMLImageElement;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate the state where the fallback has already been applied
    // The directive checks `img.src.includes(targetFallback)`
    imgEl.src = '/assets/account_circle_40.svg';

    // Trigger error AGAIN (meaning the fallback 404'd)
    defaultImg.triggerEventHandler('error', new Event('error'));
    fixture.detectChanges();

    // Assert we logged an error and did NOT try to set it again
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Critical: Fallback image is missing'),
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });
});
