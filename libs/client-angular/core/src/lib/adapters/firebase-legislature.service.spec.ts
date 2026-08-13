import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseLegislatureService } from './firebase-legislature.service';
import { FIREBASE_FIRESTORE, FIREBASE_FUNCTIONS } from '../firebase-tokens';

const mockHttpsCallable = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: any[]) => mockHttpsCallable(...args),
}));

describe('FirebaseLegislatureService', () => {
  let service: FirebaseLegislatureService;

  const mockFirestore = {};
  const mockFunctions = {};

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        FirebaseLegislatureService,
        { provide: FIREBASE_FIRESTORE, useValue: mockFirestore },
        { provide: FIREBASE_FUNCTIONS, useValue: mockFunctions },
      ],
    });
    service = TestBed.inject(FirebaseLegislatureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call legislation-addBill function on addBill', async () => {
    const mockCallable = vi.fn().mockResolvedValue({ data: { success: true } });
    mockHttpsCallable.mockReturnValue(mockCallable);

    const result = await service.addBill('ny', { id: 'S100' } as any);

    expect(mockHttpsCallable).toHaveBeenCalledWith(
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
    mockHttpsCallable.mockReturnValue(mockCallable);

    const result = await service.removeBill('ny', 'S100');

    expect(mockHttpsCallable).toHaveBeenCalledWith(
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
