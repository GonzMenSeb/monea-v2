import { fireEvent, render, screen, waitFor, act } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystemLegacy from 'expo-file-system/legacy';

import { StatementFilePicker } from '../StatementFilePicker';

import type { StatementFilePickerProps } from '../StatementFilePicker';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}));

const mockDocumentPicker = DocumentPicker as jest.Mocked<typeof DocumentPicker>;
const mockFileSystemLegacy = FileSystemLegacy as jest.Mocked<typeof FileSystemLegacy>;

const createDefaultProps = (
  overrides: Partial<StatementFilePickerProps> = {}
): StatementFilePickerProps => ({
  onFileSelected: jest.fn(),
  onError: jest.fn(),
  disabled: false,
  loading: false,
  ...overrides,
});

const createMockPdfAsset = (): DocumentPicker.DocumentPickerAsset => ({
  name: 'statement-2024-01.pdf',
  uri: 'file:///cache/statement.pdf',
  size: 102400,
  mimeType: 'application/pdf',
  lastModified: Date.now(),
});

const createMockXlsxAsset = (): DocumentPicker.DocumentPickerAsset => ({
  name: 'transactions-2024.xlsx',
  uri: 'file:///cache/transactions.xlsx',
  size: 51200,
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  lastModified: Date.now(),
});

describe('StatementFilePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockFileSystemLegacy.readAsStringAsync as jest.Mock).mockResolvedValue(
      Buffer.from('mock file content').toString('base64')
    );
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<StatementFilePicker {...createDefaultProps()} />);
      expect(screen.getByText('Import Bank Statement')).toBeTruthy();
    });

    it('displays description text', () => {
      render(<StatementFilePicker {...createDefaultProps()} />);
      expect(
        screen.getByText('Select a PDF or Excel statement file from your device')
      ).toBeTruthy();
    });

    it('shows supported file format badges', () => {
      render(<StatementFilePicker {...createDefaultProps()} />);
      expect(screen.getByText('PDF')).toBeTruthy();
      expect(screen.getByText('XLSX')).toBeTruthy();
    });

    it('renders select button', () => {
      render(<StatementFilePicker {...createDefaultProps()} />);
      expect(screen.getByText('Select Statement File')).toBeTruthy();
    });

    it('shows drop zone tap instruction', () => {
      render(<StatementFilePicker {...createDefaultProps()} />);
      expect(screen.getByText('Tap to select a file')).toBeTruthy();
    });
  });

  describe('File Selection', () => {
    it('calls document picker when button is pressed', async () => {
      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: true,
        assets: null,
      });

      render(<StatementFilePicker {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      expect(mockDocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
    });

    it('calls onFileSelected with PDF file', async () => {
      const onFileSelected = jest.fn();
      const pdfAsset = createMockPdfAsset();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [pdfAsset],
      });

      render(<StatementFilePicker {...createDefaultProps({ onFileSelected })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(onFileSelected).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'statement-2024-01.pdf',
            uri: pdfAsset.uri,
            fileType: 'pdf',
          }),
          expect.any(Buffer)
        );
      });
    });

    it('calls onFileSelected with XLSX file', async () => {
      const onFileSelected = jest.fn();
      const xlsxAsset = createMockXlsxAsset();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [xlsxAsset],
      });

      render(<StatementFilePicker {...createDefaultProps({ onFileSelected })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(onFileSelected).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'transactions-2024.xlsx',
            fileType: 'xlsx',
          }),
          expect.any(Buffer)
        );
      });
    });

    it('does not call onFileSelected when picker is canceled', async () => {
      const onFileSelected = jest.fn();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: true,
        assets: null,
      });

      render(<StatementFilePicker {...createDefaultProps({ onFileSelected })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      expect(onFileSelected).not.toHaveBeenCalled();
    });

    it('detects file type from extension when MIME type is missing', async () => {
      const onFileSelected = jest.fn();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            name: 'report.xlsx',
            uri: 'file:///cache/report.xlsx',
            size: 1024,
            mimeType: undefined,
            lastModified: Date.now(),
          },
        ],
      });

      render(<StatementFilePicker {...createDefaultProps({ onFileSelected })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(onFileSelected).toHaveBeenCalledWith(
          expect.objectContaining({
            fileType: 'xlsx',
          }),
          expect.any(Buffer)
        );
      });
    });
  });

  describe('File Display', () => {
    it('displays selected file information', async () => {
      const pdfAsset = createMockPdfAsset();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [pdfAsset],
      });

      render(<StatementFilePicker {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(screen.getByText('statement-2024-01.pdf')).toBeTruthy();
      });
    });

    it('displays file size and type', async () => {
      const pdfAsset = createMockPdfAsset();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [pdfAsset],
      });

      render(<StatementFilePicker {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(screen.getByText('100.0 KB • PDF')).toBeTruthy();
      });
    });

    it('shows change file button after file is selected', async () => {
      const pdfAsset = createMockPdfAsset();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [pdfAsset],
      });

      render(<StatementFilePicker {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(screen.getByText('Change File')).toBeTruthy();
      });
    });

    it('clears file when change file is pressed', async () => {
      const pdfAsset = createMockPdfAsset();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [pdfAsset],
      });

      render(<StatementFilePicker {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(screen.getByText('Change File')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByText('Change File'));
      });

      expect(screen.getByText('Select Statement File')).toBeTruthy();
      expect(screen.queryByText('statement-2024-01.pdf')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('calls onError for unsupported file type', async () => {
      const onError = jest.fn();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            name: 'document.txt',
            uri: 'file:///cache/document.txt',
            size: 1024,
            mimeType: 'text/plain',
            lastModified: Date.now(),
          },
        ],
      });

      render(<StatementFilePicker {...createDefaultProps({ onError })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          'Unsupported file format. Please select a PDF or XLSX file.'
        );
      });
    });

    it('calls onError when file reading fails', async () => {
      const onError = jest.fn();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [createMockPdfAsset()],
      });

      (mockFileSystemLegacy.readAsStringAsync as jest.Mock).mockRejectedValue(
        new Error('Failed to read file')
      );

      render(<StatementFilePicker {...createDefaultProps({ onError })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to read file');
      });
    });

    it('calls onError with generic message for non-Error exceptions', async () => {
      const onError = jest.fn();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [createMockPdfAsset()],
      });

      (mockFileSystemLegacy.readAsStringAsync as jest.Mock).mockRejectedValue('Unknown error');

      render(<StatementFilePicker {...createDefaultProps({ onError })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to read file');
      });
    });
  });

  describe('Disabled State', () => {
    it('does not call document picker when disabled', async () => {
      render(<StatementFilePicker {...createDefaultProps({ disabled: true })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      expect(mockDocumentPicker.getDocumentAsync).not.toHaveBeenCalled();
    });

    it('does not call document picker when loading', async () => {
      render(<StatementFilePicker {...createDefaultProps({ loading: true })} />);

      const dropZone = screen.getByLabelText('Select bank statement file');
      await act(async () => {
        fireEvent.press(dropZone);
      });

      expect(mockDocumentPicker.getDocumentAsync).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading prop is true', () => {
      const { UNSAFE_getByType } = render(
        <StatementFilePicker {...createDefaultProps({ loading: true })} />
      );
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('maintains drop zone accessibility when loading', () => {
      render(<StatementFilePicker {...createDefaultProps({ loading: true })} />);
      expect(screen.getByLabelText('Select bank statement file')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility label on drop zone', () => {
      render(<StatementFilePicker {...createDefaultProps()} />);
      expect(screen.getByLabelText('Select bank statement file')).toBeTruthy();
    });

    it('has accessibility hint on drop zone', () => {
      render(<StatementFilePicker {...createDefaultProps()} />);
      expect(screen.getByA11yHint('Opens file picker to select PDF or Excel file')).toBeTruthy();
    });
  });

  describe('File Size Formatting', () => {
    it('formats bytes correctly', async () => {
      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            ...createMockPdfAsset(),
            size: 500,
          },
        ],
      });

      render(<StatementFilePicker {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(screen.getByText('500 B • PDF')).toBeTruthy();
      });
    });

    it('formats kilobytes correctly', async () => {
      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            ...createMockPdfAsset(),
            size: 2048,
          },
        ],
      });

      render(<StatementFilePicker {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(screen.getByText('2.0 KB • PDF')).toBeTruthy();
      });
    });

    it('formats megabytes correctly', async () => {
      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            ...createMockPdfAsset(),
            size: 5 * 1024 * 1024,
          },
        ],
      });

      render(<StatementFilePicker {...createDefaultProps()} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(screen.getByText('5.0 MB • PDF')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty assets array', async () => {
      const onFileSelected = jest.fn();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [],
      });

      render(<StatementFilePicker {...createDefaultProps({ onFileSelected })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      expect(onFileSelected).not.toHaveBeenCalled();
    });

    it('handles missing file size by using buffer length', async () => {
      const onFileSelected = jest.fn();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            ...createMockPdfAsset(),
            size: undefined,
          },
        ],
      });

      render(<StatementFilePicker {...createDefaultProps({ onFileSelected })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(onFileSelected).toHaveBeenCalledWith(
          expect.objectContaining({
            size: expect.any(Number),
          }),
          expect.any(Buffer)
        );
      });
    });

    it('handles xls (old Excel) format via extension', async () => {
      const onFileSelected = jest.fn();

      (mockDocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            name: 'old-format.xls',
            uri: 'file:///cache/old-format.xls',
            size: 1024,
            mimeType: undefined,
            lastModified: Date.now(),
          },
        ],
      });

      render(<StatementFilePicker {...createDefaultProps({ onFileSelected })} />);

      await act(async () => {
        fireEvent.press(screen.getByText('Select Statement File'));
      });

      await waitFor(() => {
        expect(onFileSelected).toHaveBeenCalledWith(
          expect.objectContaining({
            fileType: 'xlsx',
          }),
          expect.any(Buffer)
        );
      });
    });
  });
});
