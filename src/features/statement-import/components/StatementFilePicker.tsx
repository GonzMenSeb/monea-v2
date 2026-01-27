import { useCallback, useState } from 'react';

import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { styled, Stack, Text, YStack, XStack } from 'tamagui';

import { Body, Caption, Button } from '@/shared/components/ui';
import { useHaptics } from '@/shared/hooks/useHaptics';

type SupportedFileType = 'pdf' | 'xlsx';

interface SelectedFile {
  name: string;
  uri: string;
  size: number;
  mimeType: string;
  fileType: SupportedFileType;
}

interface StatementFilePickerProps {
  onFileSelected: (file: SelectedFile, data: Buffer) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const MIME_TO_FILE_TYPE: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xlsx',
};

const CardContainer = styled(YStack, {
  name: 'StatementFilePicker',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$4',
});

const DropZone = styled(Stack, {
  name: 'DropZone',
  borderWidth: 2,
  borderStyle: 'dashed',
  borderColor: '$border',
  borderRadius: '$3',
  padding: '$6',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$3',
  minHeight: 160,

  variants: {
    disabled: {
      true: {
        opacity: 0.5,
      },
    },
    hasFile: {
      true: {
        borderColor: '$accentPrimary',
        backgroundColor: '$primaryMuted',
      },
    },
  } as const,
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 56,
  height: 56,
  borderRadius: '$full',
  backgroundColor: '$backgroundElevated',
  alignItems: 'center',
  justifyContent: 'center',
});

const FileInfoContainer = styled(XStack, {
  name: 'FileInfoContainer',
  alignItems: 'center',
  gap: '$3',
  padding: '$3',
  backgroundColor: '$backgroundElevated',
  borderRadius: '$3',
});

const FileTypeIcon = styled(Stack, {
  name: 'FileTypeIcon',
  width: 40,
  height: 40,
  borderRadius: '$2',
  alignItems: 'center',
  justifyContent: 'center',
});

const SupportedFormats = styled(XStack, {
  name: 'SupportedFormats',
  gap: '$2',
  flexWrap: 'wrap',
  justifyContent: 'center',
});

const FormatBadge = styled(Stack, {
  name: 'FormatBadge',
  backgroundColor: '$backgroundElevated',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$2',
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeFromName(fileName: string): SupportedFileType | null {
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'pdf') {
    return 'pdf';
  }
  if (extension === 'xlsx' || extension === 'xls') {
    return 'xlsx';
  }
  return null;
}

function getFileTypeIcon(fileType: SupportedFileType): string {
  return fileType === 'pdf' ? '📄' : '📊';
}

function getFileTypeColor(fileType: SupportedFileType): string {
  return fileType === 'pdf' ? '$accentDanger' : '$accentPrimary';
}

export function StatementFilePicker({
  onFileSelected,
  onError,
  disabled = false,
  loading = false,
}: StatementFilePickerProps): React.ReactElement {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { light, error: hapticError, success: hapticSuccess } = useHaptics();

  const handlePickFile = useCallback(async (): Promise<void> => {
    if (disabled || loading || isLoading) {
      return;
    }

    light();
    setIsLoading(true);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_MIME_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsLoading(false);
        return;
      }

      const asset = result.assets[0]!;
      let fileType: SupportedFileType | null = null;

      if (asset.mimeType && MIME_TO_FILE_TYPE[asset.mimeType]) {
        fileType = MIME_TO_FILE_TYPE[asset.mimeType] ?? null;
      } else {
        fileType = getFileTypeFromName(asset.name);
      }

      if (!fileType) {
        setIsLoading(false);
        hapticError();
        onError?.('Unsupported file format. Please select a PDF or XLSX file.');
        return;
      }

      const fileContent = await readAsStringAsync(asset.uri, {
        encoding: EncodingType.Base64,
      });

      const buffer = Buffer.from(fileContent, 'base64');

      const file: SelectedFile = {
        name: asset.name,
        uri: asset.uri,
        size: asset.size ?? buffer.length,
        mimeType: asset.mimeType ?? '',
        fileType,
      };

      setSelectedFile(file);
      hapticSuccess();
      onFileSelected(file, buffer);
    } catch (err) {
      hapticError();
      const errorMessage = err instanceof Error ? err.message : 'Failed to read file';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, loading, isLoading, light, hapticError, hapticSuccess, onFileSelected, onError]);

  const handleClearFile = useCallback((): void => {
    light();
    setSelectedFile(null);
  }, [light]);

  const isDisabled = disabled || loading || isLoading;
  const showLoading = loading || isLoading;

  return (
    <CardContainer>
      <YStack alignItems="center" gap="$2">
        <Body fontWeight="600">Import Bank Statement</Body>
        <Caption color="$textSecondary" textAlign="center">
          Select a PDF or Excel statement file from your device
        </Caption>
      </YStack>

      {selectedFile ? (
        <YStack gap="$3">
          <FileInfoContainer>
            <FileTypeIcon backgroundColor={getFileTypeColor(selectedFile.fileType)}>
              <Text fontSize="$4">{getFileTypeIcon(selectedFile.fileType)}</Text>
            </FileTypeIcon>
            <YStack flex={1}>
              <Body numberOfLines={1} fontWeight="500">
                {selectedFile.name}
              </Body>
              <Caption color="$textSecondary">
                {formatFileSize(selectedFile.size)} • {selectedFile.fileType.toUpperCase()}
              </Caption>
            </YStack>
          </FileInfoContainer>

          <XStack gap="$2">
            <Button variant="outline" onPress={handleClearFile} disabled={isDisabled} fullWidth>
              Change File
            </Button>
          </XStack>
        </YStack>
      ) : (
        <DropZone
          disabled={isDisabled}
          onPress={handlePickFile}
          pressStyle={{ opacity: 0.8 }}
          animation="fast"
          accessibilityRole="button"
          accessibilityLabel="Select bank statement file"
          accessibilityHint="Opens file picker to select PDF or Excel file"
        >
          <IconContainer>
            <Text fontSize="$6">📁</Text>
          </IconContainer>
          <YStack alignItems="center" gap="$1">
            <Body color="$textSecondary">Tap to select a file</Body>
            <SupportedFormats>
              <FormatBadge>
                <Caption color="$textMuted">PDF</Caption>
              </FormatBadge>
              <FormatBadge>
                <Caption color="$textMuted">XLSX</Caption>
              </FormatBadge>
            </SupportedFormats>
          </YStack>
        </DropZone>
      )}

      {!selectedFile && (
        <Button onPress={handlePickFile} loading={showLoading} disabled={isDisabled} fullWidth>
          {showLoading ? 'Loading...' : 'Select Statement File'}
        </Button>
      )}
    </CardContainer>
  );
}

export type { SelectedFile, StatementFilePickerProps };
