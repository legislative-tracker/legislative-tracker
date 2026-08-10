import { Directive, HostListener, Input, ElementRef, Renderer2 } from '@angular/core';
@Directive({
  selector: 'img[appFallback]',
  standalone: true,
})
export class ImgFallbackDirective {
  // Allow the user to pass a custom fallback, or use a default
  private readonly DEFAULT_IMAGE = '/assets/account_circle_40.svg';
  @Input() appFallback = this.DEFAULT_IMAGE;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2,
  ) {}

  @HostListener('error')
  onError() {
    // We must revert to the default if the input is falsy.
    const targetFallback = this.appFallback || this.DEFAULT_IMAGE;

    const img = this.el.nativeElement;

    // Check against the REAL target (not the potentially empty input)
    if (img.src.includes(targetFallback)) {
      console.error('🚨 Critical: Fallback image is missing at:', targetFallback);
      return;
    }

    console.log(`Original image failed. Switching to: ${targetFallback}`);

    // Wipe srcset to prevent browser confusion
    img.removeAttribute('srcset');
    this.renderer.removeAttribute(img, 'srcset');

    // Apply the correct fallback
    this.renderer.setAttribute(img, 'src', targetFallback);
    this.renderer.addClass(img, 'is-placeholder');
  }
}
