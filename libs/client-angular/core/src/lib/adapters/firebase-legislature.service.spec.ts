import { TestBed } from '@angular/core/testing';
import { FirebaseApp } from '@angular/fire/app';
import { Firestore } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseLegislatureService } from './firebase-legislature.service';

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  getFirestore: vi.fn().mockReturnValue({}),
  doc: vi.fn(),
  docData: vi.fn(),
  collection: vi.fn(),
  collectionData: vi.fn(),
}));

vi.mock('@angular/fire/functions', () => ({
  Functions: class {},
  httpsCallable: vi.fn(),
}));

describe('FirebaseLegislatureService', () => {
  let service: FirebaseLegislatureService;

  const mockFirebaseApp = { name: '[DEFAULT]' };
  const mockFirestore = {};
  const mockFunctions = {};

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        FirebaseLegislatureService,
        { provide: FirebaseApp, useValue: mockFirebaseApp },
        { provide: Firestore, useValue: mockFirestore },
        { provide: Functions, useValue: mockFunctions },
      ],
    });
    service = TestBed.inject(FirebaseLegislatureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call legislation-addBill function on addBill', async () => {
    const mockCallable = vi.fn().mockResolvedValue({ data: { success: true } });
    vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

    const result = await service.addBill('ny', { id: 'S100' } as any);

    expect(httpsCallable).toHaveBeenCalledWith(
      mockFunctions,
      'legislation-addBill',
    );
    expect(mockCallable).toHaveBeenCalledWith({
      state: 'ny',
      bill: { id: 'S100' },
    });
    expect(result).toEqual({ data: { success: true } });
  });

  it('should call legislation-removeBill function on removeBill', async () => {
    const mockCallable = vi.fn().mockResolvedValue({ data: { success: true } });
    vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

    const result = await service.removeBill('ny', 'S100');

    expect(httpsCallable).toHaveBeenCalledWith(
      mockFunctions,
      'legislation-removeBill',
    );
    expect(mockCallable).toHaveBeenCalledWith({
      state: 'ny',
      billId: 'S100',
    });
    expect(result).toEqual({ data: { success: true } });
  });
});
