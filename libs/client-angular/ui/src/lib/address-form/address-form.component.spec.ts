import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';

import { AddressForm } from './address-form.component';

describe('AddressForm', () => {
  let component: AddressForm;
  let fixture: ComponentFixture<AddressForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressForm], // Standalone component
      providers: [
        provideNoopAnimations(), // Required for Material components
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressForm);
    component = fixture.componentInstance;

    // Default initialization (required input)
    fixture.componentRef.setInput('formType', 'search');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Search Mode', () => {
    beforeEach(() => {
      // Ensure we are in search mode
      fixture.componentRef.setInput('formType', 'search');
      fixture.detectChanges();
    });

    it('should initialize with invalid search form', () => {
      expect(component.searchAddress.valid).toBe(false);
      expect(component.searchAddress.controls.address.hasError('required')).toBe(true);
    });

    it('should emit form values on submit when valid', () => {
      // Spy on the output
      const emitSpy = vi.spyOn(component.formSubmit, 'emit');

      // Fill out the form
      component.searchAddress.patchValue({
        address: '123 Main St',
        city: 'Albany',
        state: 'NY',
        postalCode: '12203',
      });

      // Trigger submit
      component.onSubmit();

      // Assert
      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '123 Main St',
          city: 'Albany',
          state: 'NY',
          postalCode: '12203',
        }),
      );
    });

    it('should validate postal code length', () => {
      const postalControl = component.searchAddress.controls.postalCode;

      // Too short
      postalControl.setValue('1234');
      expect(postalControl.valid).toBe(false);

      // Too long
      postalControl.setValue('123456');
      expect(postalControl.valid).toBe(false);

      // Just right
      postalControl.setValue('12345');
      expect(postalControl.valid).toBe(true);
    });
  });

  describe('Shipping Mode', () => {
    beforeEach(() => {
      // Switch inputs to shipping mode
      fixture.componentRef.setInput('formType', 'shipping');
      fixture.detectChanges();
    });

    it('should validate required shipping fields', () => {
      const form = component.shippingAddress;
      expect(form.valid).toBe(false);

      // FirstName is required
      expect(form.controls.firstName.hasError('required')).toBe(true);

      // Shipping method defaults to 'free', should be valid
      expect(form.controls.shipping.value).toBe('free');
    });

    it('should emit shipping values on submit', () => {
      const emitSpy = vi.spyOn(component.formSubmit, 'emit');

      component.shippingAddress.patchValue({
        firstName: 'Jane',
        lastName: 'Doe',
        address: '456 Market St',
        city: 'Troy',
        state: 'NY',
        postalCode: '12180',
        shipping: 'priority',
      });

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
          address: '456 Market St',
          shipping: 'priority',
        }),
      );
    });
  });

  describe('Template Integration', () => {
    it('should show different fields based on input signal', () => {
      // Check Search Mode
      fixture.componentRef.setInput('formType', 'search');
      fixture.detectChanges();

      // Search form shouldn't have First/Last Name inputs
      const firstNameInput = fixture.debugElement.query(
        By.css('input[formControlName="firstName"]'),
      );
      expect(firstNameInput).toBeNull();

      // Check Shipping Mode
      fixture.componentRef.setInput('formType', 'shipping');
      fixture.detectChanges();

      // Now First Name should exist
      const shippingNameInput = fixture.debugElement.query(
        By.css('input[formControlName="firstName"]'),
      );
      expect(shippingNameInput).toBeTruthy();
    });
  });
});
