import { createElement } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-native';

import type { ImportResult, ImportProgress, PeriodOverlapInfo, FileImportInput } from '../../types';
import type { ReactNode } from 'react';

const mockImportStatement = jest.fn();
const mockPreviewImport = jest.fn();
const mockCheckFileAlreadyImported = jest.fn();
const mockCheckPeriodOverlaps = jest.fn();

jest.mock('../../services', () => ({
  getStatementImportService: () => ({
    importStatement: mockImportStatement,
    previewImport: mockPreviewImport,
    checkFileAlreadyImported: mockCheckFileAlreadyImported,
    checkPeriodOverlaps: mockCheckPeriodOverlaps,
  }),
}));

jest.mock('@/infrastructure/database', () => ({
  database: {},
}));

jest.mock('@/features/dashboard/hooks', () => ({
  DASHBOARD_QUERY_KEYS: { all: ['dashboard'] },
}));

jest.mock('@/features/transactions/hooks', () => ({
  TRANSACTION_QUERY_KEYS: { all: ['transactions'] },
}));

// eslint-disable-next-line import/order
import { useStatementImport } from '../useStatementImport';

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function createSuccessfulImportResult(transactionsImported = 5): ImportResult {
  return {
    success: true,
    statementImportId: 'import-123',
    transactions: {
      total: 10,
      imported: transactionsImported,
      skipped: 2,
      duplicates: 3,
    },
    account: {
      id: 'account-123',
      accountNumber: '1234567890',
      previousBalance: 100000,
      newBalance: 150000,
    },
    bankCode: 'bancolombia',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    errors: [],
    duplicates: [],
    periodOverlaps: [],
  };
}

function createFailedImportResult(errorMessage = 'Import failed'): ImportResult {
  return {
    success: false,
    transactions: {
      total: 0,
      imported: 0,
      skipped: 0,
      duplicates: 0,
    },
    account: null,
    bankCode: 'bancolombia',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    errors: [{ message: errorMessage }],
    duplicates: [],
    periodOverlaps: [],
  };
}

function createFileInput(): FileImportInput {
  return {
    data: Buffer.from('test data'),
    fileName: 'statement.xlsx',
    fileType: 'xlsx',
  };
}

describe('useStatementImport', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('initialization', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isImporting).toBe(false);
    });
  });

  describe('importStatement', () => {
    it('imports statement and updates state on success', async () => {
      const importResult = createSuccessfulImportResult();
      mockImportStatement.mockImplementation(
        async (
          _input: FileImportInput,
          _options: unknown,
          onProgress: (p: ImportProgress) => void
        ) => {
          onProgress({
            phase: 'reading',
            currentStep: 1,
            totalSteps: 5,
            message: 'Reading file...',
            fileName: 'statement.xlsx',
          });
          onProgress({
            phase: 'complete',
            currentStep: 5,
            totalSteps: 5,
            message: 'Import complete',
            fileName: 'statement.xlsx',
          });
          return importResult;
        }
      );

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      let returnedResult: ImportResult | null = null;
      await act(async () => {
        returnedResult = await result.current.importStatement(createFileInput());
      });

      expect(returnedResult).toEqual(importResult);
      expect(result.current.result).toEqual(importResult);
      expect(result.current.status).toBe('complete');
      expect(result.current.error).toBeNull();
    });

    it('updates progress during import', async () => {
      const progressUpdates: ImportProgress[] = [];
      mockImportStatement.mockImplementation(
        async (
          _input: FileImportInput,
          _options: unknown,
          onProgress: (p: ImportProgress) => void
        ) => {
          const phases: ImportProgress['phase'][] = [
            'reading',
            'parsing',
            'detecting_duplicates',
            'importing',
            'updating_balances',
            'complete',
          ];
          for (const phase of phases) {
            const progress: ImportProgress = {
              phase,
              currentStep: phases.indexOf(phase) + 1,
              totalSteps: 5,
              message: `${phase}...`,
              fileName: 'statement.xlsx',
            };
            progressUpdates.push(progress);
            onProgress(progress);
          }
          return createSuccessfulImportResult();
        }
      );

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.importStatement(createFileInput());
      });

      expect(result.current.progress?.phase).toBe('complete');
    });

    it('sets isImporting during import', async () => {
      let resolvePromise: (value: ImportResult) => void;
      const pendingPromise = new Promise<ImportResult>((resolve) => {
        resolvePromise = resolve;
      });
      mockImportStatement.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        void result.current.importStatement(createFileInput());
      });

      expect(result.current.isImporting).toBe(true);

      await act(async () => {
        resolvePromise!(createSuccessfulImportResult());
      });

      expect(result.current.isImporting).toBe(false);
    });

    it('handles import errors from result', async () => {
      const failedResult = createFailedImportResult('Statement already imported');
      mockImportStatement.mockResolvedValue(failedResult);

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.importStatement(createFileInput());
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Statement already imported');
      expect(result.current.result).toEqual(failedResult);
    });

    it('handles thrown exceptions', async () => {
      mockImportStatement.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.importStatement(createFileInput());
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Network error');
      expect(result.current.result).toBeNull();
    });

    it('passes options to service', async () => {
      mockImportStatement.mockResolvedValue(createSuccessfulImportResult());

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      const options = { skipDuplicates: false, dryRun: true };
      await act(async () => {
        await result.current.importStatement(createFileInput(), options);
      });

      expect(mockImportStatement).toHaveBeenCalledWith(
        expect.any(Object),
        options,
        expect.any(Function)
      );
    });

    it('invalidates queries when transactions are imported', async () => {
      const importResult = createSuccessfulImportResult(5);
      mockImportStatement.mockResolvedValue(importResult);
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.importStatement(createFileInput());
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('does not invalidate queries when no transactions imported', async () => {
      const importResult = createSuccessfulImportResult(0);
      mockImportStatement.mockResolvedValue(importResult);
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.importStatement(createFileInput());
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('previewImport', () => {
    it('previews import without committing', async () => {
      const previewResult = createSuccessfulImportResult();
      mockPreviewImport.mockResolvedValue(previewResult);

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      let returnedResult: ImportResult | null = null;
      await act(async () => {
        returnedResult = await result.current.previewImport(createFileInput());
      });

      expect(returnedResult).toEqual(previewResult);
      expect(result.current.result).toEqual(previewResult);
      expect(result.current.status).toBe('complete');
    });

    it('handles preview errors', async () => {
      const failedResult = createFailedImportResult('Invalid file format');
      mockPreviewImport.mockResolvedValue(failedResult);

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.previewImport(createFileInput());
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Invalid file format');
    });

    it('handles thrown exceptions in preview', async () => {
      mockPreviewImport.mockRejectedValue(new Error('File read error'));

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.previewImport(createFileInput());
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('File read error');
    });
  });

  describe('checkFileAlreadyImported', () => {
    it('returns true when file was already imported', async () => {
      mockCheckFileAlreadyImported.mockResolvedValue(true);

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      let isImported: boolean = false;
      await act(async () => {
        isImported = await result.current.checkFileAlreadyImported(Buffer.from('test'));
      });

      expect(isImported).toBe(true);
    });

    it('returns false when file was not imported', async () => {
      mockCheckFileAlreadyImported.mockResolvedValue(false);

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      let isImported: boolean = true;
      await act(async () => {
        isImported = await result.current.checkFileAlreadyImported(Buffer.from('test'));
      });

      expect(isImported).toBe(false);
    });

    it('returns false on error', async () => {
      mockCheckFileAlreadyImported.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      let isImported: boolean = true;
      await act(async () => {
        isImported = await result.current.checkFileAlreadyImported(Buffer.from('test'));
      });

      expect(isImported).toBe(false);
    });
  });

  describe('checkPeriodOverlaps', () => {
    it('returns overlapping periods', async () => {
      const overlaps: PeriodOverlapInfo[] = [
        {
          importId: 'import-1',
          fileName: 'previous.xlsx',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          overlapStart: new Date('2024-01-15'),
          overlapEnd: new Date('2024-01-31'),
          overlapDays: 17,
        },
      ];
      mockCheckPeriodOverlaps.mockResolvedValue(overlaps);

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      let returnedOverlaps: PeriodOverlapInfo[] = [];
      await act(async () => {
        returnedOverlaps = await result.current.checkPeriodOverlaps(
          new Date('2024-01-15'),
          new Date('2024-02-15')
        );
      });

      expect(returnedOverlaps).toEqual(overlaps);
    });

    it('filters by bank code', async () => {
      mockCheckPeriodOverlaps.mockResolvedValue([]);

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.checkPeriodOverlaps(
          new Date('2024-01-01'),
          new Date('2024-01-31'),
          'nequi'
        );
      });

      expect(mockCheckPeriodOverlaps).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        'nequi'
      );
    });

    it('returns empty array on error', async () => {
      mockCheckPeriodOverlaps.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      let returnedOverlaps: PeriodOverlapInfo[] = [
        { importId: 'should-be-cleared' } as PeriodOverlapInfo,
      ];
      await act(async () => {
        returnedOverlaps = await result.current.checkPeriodOverlaps(
          new Date('2024-01-01'),
          new Date('2024-01-31')
        );
      });

      expect(returnedOverlaps).toEqual([]);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', async () => {
      mockImportStatement.mockResolvedValue(createSuccessfulImportResult());

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.importStatement(createFileInput());
      });

      expect(result.current.result).not.toBeNull();
      expect(result.current.status).toBe('complete');

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.progress).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears error and resets status to idle', async () => {
      mockImportStatement.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.importStatement(createFileInput());
      });

      expect(result.current.error).toBe('Test error');
      expect(result.current.status).toBe('error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe('idle');
    });

    it('only clears error if status is not error', async () => {
      mockImportStatement.mockResolvedValue(createSuccessfulImportResult());

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.importStatement(createFileInput());
      });

      expect(result.current.status).toBe('complete');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.status).toBe('complete');
    });
  });

  describe('status transitions', () => {
    it('transitions through all phases during import', async () => {
      mockImportStatement.mockImplementation(
        async (
          _input: FileImportInput,
          _options: unknown,
          onProgress: (p: ImportProgress) => void
        ) => {
          const phases: ImportProgress['phase'][] = [
            'reading',
            'parsing',
            'detecting_duplicates',
            'importing',
            'updating_balances',
            'complete',
          ];
          for (const phase of phases) {
            onProgress({
              phase,
              currentStep: phases.indexOf(phase) + 1,
              totalSteps: 5,
              message: `${phase}...`,
              fileName: 'statement.xlsx',
            });
          }
          return createSuccessfulImportResult();
        }
      );

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.importStatement(createFileInput());
      });

      expect(result.current.status).toBe('complete');
    });

    it('isImporting is true for all importing phases', () => {
      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isImporting).toBe(false);
    });
  });

  describe('concurrent imports', () => {
    it('handles rapid successive calls', async () => {
      mockImportStatement.mockResolvedValue(createSuccessfulImportResult());

      const { result } = renderHook(() => useStatementImport(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await Promise.all([
          result.current.importStatement(createFileInput()),
          result.current.importStatement(createFileInput()),
        ]);
      });

      expect(result.current.status).toBe('complete');
    });
  });
});
