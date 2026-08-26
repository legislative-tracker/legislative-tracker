import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { doc } from 'firebase/firestore';
import { FirebaseLegislatureService } from './firebase-legislature.service';
import {
  FIREBASE_FIRESTORE,
  FIREBASE_FUNCTIONS,
} from '../firebase-tokens.token';

const mockHttpsCallable = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn().mockReturnValue({}),
  setDoc: vi.fn().mockResolvedValue(undefined),
  onSnapshot: vi.fn().mockReturnValue(vi.fn()),
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

  it('should clean ocd-person/ prefix when forming member document reference', () => {
    const sub = service
      .getMemberById('us-ny', 'ocd-person/9dd382bd-0f4f-4a99-ad58-679e26114f70')
      .subscribe();
    expect(doc).toHaveBeenCalledWith(
      mockFirestore,
      'legislatures/us-ny/ocd-person/9dd382bd-0f4f-4a99-ad58-679e26114f70',
    );
    sub.unsubscribe();
  });

  it('should clean ocd-bill/ prefix when forming bill document reference', () => {
    const sub = service
      .getBillById('us-ny', 'ocd-bill/9dd382bd-0f4f-4a99-ad58-679e26114f70')
      .subscribe();
    expect(doc).toHaveBeenCalledWith(
      mockFirestore,
      'legislatures/us-ny/ocd-bill/9dd382bd-0f4f-4a99-ad58-679e26114f70',
    );
    sub.unsubscribe();
  });

  it('should call legislation-addBills function on addBills', async () => {
    const mockCallable = vi.fn().mockResolvedValue({ data: { success: true } });
    mockHttpsCallable.mockReturnValue(mockCallable);

    const result = await service.addBills({
      state: 'us-ny',
      name: 'Clean Water Act',
      billIds: ['S100', 'A200'],
    });

    expect(mockHttpsCallable).toHaveBeenCalledWith(
      mockFunctions,
      'legislation-addBills',
    );
    expect(mockCallable).toHaveBeenCalledWith({
      state: 'us-ny',
      name: 'Clean Water Act',
      description: undefined,
      billIds: ['S100', 'A200'],
    });
    expect(result).toEqual({ data: { success: true } });
  });

  it('should call legislation-removeBill function on removeBill', async () => {
    const mockCallable = vi.fn().mockResolvedValue({ data: { success: true } });
    mockHttpsCallable.mockReturnValue(mockCallable);

    const result = await service.removeBill('us-ny', 'S100', 'upper');

    expect(mockHttpsCallable).toHaveBeenCalledWith(
      mockFunctions,
      'legislation-removeBill',
    );
    expect(mockCallable).toHaveBeenCalledWith({
      state: 'us-ny',
      billId: 'S100',
      chamber: 'upper',
    });
    expect(result).toEqual({ data: { success: true } });
  });

  it('should call updateBill function with correct parameters on updateBill', async () => {
    const mockCallable = vi.fn().mockResolvedValue({ data: { success: true } });
    mockHttpsCallable.mockReturnValue(mockCallable);

    const updateParams = {
      state: 'us-ny',
      id: 'LEG-100',
      name: 'Updated Title',
      description: 'Updated Description',
      upperBillId: 'S101',
      lowerBillId: 'A201',
    };

    const result = await service.updateBill(updateParams);

    expect(result).toEqual({ success: true });
  });

  it('should call legislation-manualUpdate function on manualUpdateLegislation', async () => {
    const mockCallable = vi
      .fn()
      .mockResolvedValue({ data: { status: 'success' } });
    mockHttpsCallable.mockReturnValue(mockCallable);

    const result = await service.manualUpdateLegislation();

    expect(mockHttpsCallable).toHaveBeenCalledWith(
      mockFunctions,
      'legislation-manualUpdate',
    );
    expect(mockCallable).toHaveBeenCalledWith();
    expect(result).toEqual({ data: { status: 'success' } });
  });

  it('should call legislators-manualUpdate function on manualUpdateLegislators', async () => {
    const mockCallable = vi
      .fn()
      .mockResolvedValue({ data: { status: 'success' } });
    mockHttpsCallable.mockReturnValue(mockCallable);

    const result = await service.manualUpdateLegislators();

    expect(mockHttpsCallable).toHaveBeenCalledWith(
      mockFunctions,
      'legislators-manualUpdate',
    );
    expect(mockCallable).toHaveBeenCalledWith();
    expect(result).toEqual({ data: { status: 'success' } });
  });
});
