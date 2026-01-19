import { useCallback, useEffect, useState } from 'react';

import { Linking, Pressable, ScrollView } from 'react-native';

import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { smsPermissions } from '@/infrastructure/sms';
import { Screen } from '@/shared/components/layout';
import { Heading, Body, Caption } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { PermissionState } from '@/infrastructure/sms';

type SettingItemVariant = 'default' | 'destructive';

interface SettingItem {
  id: string;
  icon: string;
  title: string;
  description?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  variant?: SettingItemVariant;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

const SectionContainer = styled(YStack, {
  name: 'SectionContainer',
  marginBottom: '$6',
});

const SectionHeader = styled(Stack, {
  name: 'SectionHeader',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
});

const SectionTitle = styled(Text, {
  name: 'SectionTitle',
  color: '$textSecondary',
  fontSize: '$1',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

const ItemsContainer = styled(YStack, {
  name: 'ItemsContainer',
  backgroundColor: '$backgroundSurface',
  marginHorizontal: '$4',
  borderRadius: '$4',
  overflow: 'hidden',
});

const ItemRow = styled(XStack, {
  name: 'ItemRow',
  alignItems: 'center',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
});

const ItemSeparator = styled(Stack, {
  name: 'ItemSeparator',
  height: 1,
  backgroundColor: '$border',
  marginLeft: 56,
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 40,
  height: 40,
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '$3',
});

const ContentContainer = styled(YStack, {
  name: 'ContentContainer',
  flex: 1,
});

const Chevron = styled(Text, {
  name: 'Chevron',
  color: '$textMuted',
  fontSize: '$4',
  marginLeft: '$2',
});

const VersionContainer = styled(YStack, {
  name: 'VersionContainer',
  alignItems: 'center',
  paddingVertical: '$6',
});

const BadgeContainer = styled(Stack, {
  name: 'BadgeContainer',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
});

interface SettingItemRowProps {
  item: SettingItem;
  isLast: boolean;
}

function SettingItemRow({ item, isLast }: SettingItemRowProps): React.ReactElement {
  const isDestructive = item.variant === 'destructive';

  return (
    <>
      <Pressable onPress={item.onPress} accessibilityRole="button" accessibilityLabel={item.title}>
        {({ pressed }) => (
          <ItemRow opacity={pressed ? 0.7 : 1}>
            <IconContainer backgroundColor={isDestructive ? '$dangerMuted' : '$primaryMuted'}>
              <Body size="lg">{item.icon}</Body>
            </IconContainer>
            <ContentContainer>
              <Body color={isDestructive ? '$danger' : '$textPrimary'}>{item.title}</Body>
              {item.description && <Caption color="$textSecondary">{item.description}</Caption>}
            </ContentContainer>
            {item.rightElement}
            {item.showChevron !== false && <Chevron>{'›'}</Chevron>}
          </ItemRow>
        )}
      </Pressable>
      {!isLast && <ItemSeparator />}
    </>
  );
}

interface SettingSectionViewProps {
  section: SettingSection;
}

function SettingSectionView({ section }: SettingSectionViewProps): React.ReactElement {
  return (
    <SectionContainer>
      <SectionHeader>
        <SectionTitle>{section.title}</SectionTitle>
      </SectionHeader>
      <ItemsContainer>
        {section.items.map((item, index) => (
          <SettingItemRow key={item.id} item={item} isLast={index === section.items.length - 1} />
        ))}
      </ItemsContainer>
    </SectionContainer>
  );
}

interface PermissionStatusBadgeProps {
  state: PermissionState;
}

function PermissionStatusBadge({ state }: PermissionStatusBadgeProps): React.ReactElement {
  const statusConfig: Record<
    PermissionState,
    { label: string; bgColor: string; textColor: string }
  > = {
    granted: {
      label: 'Enabled',
      bgColor: colors.accent.primary + '20',
      textColor: colors.accent.primary,
    },
    denied: {
      label: 'Denied',
      bgColor: colors.accent.danger + '20',
      textColor: colors.accent.danger,
    },
    blocked: {
      label: 'Blocked',
      bgColor: colors.accent.danger + '20',
      textColor: colors.accent.danger,
    },
    unknown: {
      label: 'Unknown',
      bgColor: colors.background.surface,
      textColor: colors.text.secondary,
    },
    checking: {
      label: 'Checking...',
      bgColor: colors.background.surface,
      textColor: colors.text.secondary,
    },
  };

  const config = statusConfig[state];

  return (
    <BadgeContainer backgroundColor={config.bgColor}>
      <Caption color={config.textColor} fontSize="$1">
        {config.label}
      </Caption>
    </BadgeContainer>
  );
}

export function SettingsScreen(): React.ReactElement {
  const router = useRouter();
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');

  useEffect(() => {
    const checkPermissions = async (): Promise<void> => {
      setPermissionState('checking');
      const result = await smsPermissions.checkPermissionState();
      setPermissionState(result.state);
    };
    void checkPermissions();
  }, []);

  const handleSmsSettingsPress = useCallback(() => {
    router.push('/settings/sms');
  }, [router]);

  const handleImportSmsPress = useCallback(() => {
    router.push('/sync/import');
  }, [router]);

  const handleAccountsPress = useCallback(() => {
    router.push('/settings/accounts');
  }, [router]);

  const handleCategoriesPress = useCallback(() => {
    router.push('/settings/categories');
  }, [router]);

  const handleNotificationsPress = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const handleAboutPress = useCallback(() => {
    router.push('/settings/about');
  }, [router]);

  const handleHelpPress = useCallback(() => {
    void Linking.openURL('mailto:support@monea.app');
  }, []);

  const handlePrivacyPress = useCallback(() => {
    void Linking.openURL('https://monea.app/privacy');
  }, []);

  const handleTermsPress = useCallback(() => {
    void Linking.openURL('https://monea.app/terms');
  }, []);

  const handleClearDataPress = useCallback(() => {
    router.push('/settings/clear-data');
  }, [router]);

  const handleBackupPress = useCallback(() => {
    router.push('/settings/backup');
  }, [router]);

  const sections: SettingSection[] = [
    {
      title: 'Bank & SMS',
      items: [
        {
          id: 'sms-settings',
          icon: '📱',
          title: 'SMS Settings',
          description: 'Configure SMS reading preferences',
          onPress: handleSmsSettingsPress,
          rightElement: <PermissionStatusBadge state={permissionState} />,
        },
        {
          id: 'import-sms',
          icon: '📥',
          title: 'Import Historical SMS',
          description: 'Import transactions from past SMS messages',
          onPress: handleImportSmsPress,
        },
        {
          id: 'accounts',
          icon: '🏦',
          title: 'Bank Accounts',
          description: 'Manage your linked accounts',
          onPress: handleAccountsPress,
        },
        {
          id: 'categories',
          icon: '📂',
          title: 'Categories',
          description: 'Manage transaction categories',
          onPress: handleCategoriesPress,
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          id: 'notifications',
          icon: '🔔',
          title: 'Notifications',
          description: 'Manage notification preferences',
          onPress: handleNotificationsPress,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          icon: '❓',
          title: 'Help & Support',
          description: 'Get help with using Monea',
          onPress: handleHelpPress,
        },
        {
          id: 'about',
          icon: 'ℹ️',
          title: 'About',
          description: 'Version and app information',
          onPress: handleAboutPress,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'privacy',
          icon: '🔒',
          title: 'Privacy Policy',
          onPress: handlePrivacyPress,
        },
        {
          id: 'terms',
          icon: '📄',
          title: 'Terms of Service',
          onPress: handleTermsPress,
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          id: 'backup',
          icon: '💾',
          title: 'Backup & Restore',
          description: 'Export or import your data',
          onPress: handleBackupPress,
        },
        {
          id: 'clear-data',
          icon: '🗑️',
          title: 'Clear All Data',
          description: 'Delete all transactions and accounts',
          onPress: handleClearDataPress,
          variant: 'destructive',
        },
      ],
    },
  ];

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <Stack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2">
        <Heading level="h2">Settings</Heading>
      </Stack>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      >
        {sections.map((section) => (
          <SettingSectionView key={section.title} section={section} />
        ))}

        <VersionContainer>
          <Caption color="$textMuted">Monea v1.0.0</Caption>
          <Caption color="$textMuted" fontSize="$1" marginTop="$1">
            Made with ❤️ in Colombia
          </Caption>
        </VersionContainer>
      </ScrollView>
    </Screen>
  );
}
