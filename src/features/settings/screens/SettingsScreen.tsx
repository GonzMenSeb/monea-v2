import { useCallback, useEffect, useState } from 'react';

import { Linking, Pressable, ScrollView, View } from 'react-native';

import { useRouter } from 'expo-router';

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

const SECTION_CONTAINER_STYLES = 'mb-6';
const SECTION_HEADER_STYLES = 'px-4 py-2';
const ITEM_CONTAINER_STYLES = 'bg-surface-card mx-4 rounded-2xl overflow-hidden';
const ITEM_PRESSED_STYLES = 'bg-gray-50';
const ITEM_STYLES = 'flex-row items-center px-4 py-3.5';
const ITEM_SEPARATOR_STYLES = 'h-px bg-gray-100 ml-14';
const ICON_CONTAINER_STYLES = 'w-10 h-10 rounded-xl items-center justify-center mr-3';
const CONTENT_CONTAINER_STYLES = 'flex-1';
const CHEVRON_STYLES = 'text-text-muted text-lg ml-2';
const VERSION_STYLES = 'text-center py-6';

interface SettingItemRowProps {
  item: SettingItem;
  isLast: boolean;
}

function SettingItemRow({ item, isLast }: SettingItemRowProps): React.ReactElement {
  const isDestructive = item.variant === 'destructive';
  const textColorClass = isDestructive ? 'text-error-500' : 'text-text-primary';
  const iconBgClass = isDestructive ? 'bg-error-50' : 'bg-primary-50';

  return (
    <>
      <Pressable onPress={item.onPress} accessibilityRole="button" accessibilityLabel={item.title}>
        {({ pressed }) => (
          <View className={`${ITEM_STYLES} ${pressed ? ITEM_PRESSED_STYLES : ''}`}>
            <View className={`${ICON_CONTAINER_STYLES} ${iconBgClass}`}>
              <Body size="lg">{item.icon}</Body>
            </View>
            <View className={CONTENT_CONTAINER_STYLES}>
              <Body className={textColorClass}>{item.title}</Body>
              {item.description && (
                <Caption muted={false} className="text-text-secondary mt-0.5">
                  {item.description}
                </Caption>
              )}
            </View>
            {item.rightElement}
            {item.showChevron !== false && <Body className={CHEVRON_STYLES}>{'›'}</Body>}
          </View>
        )}
      </Pressable>
      {!isLast && <View className={ITEM_SEPARATOR_STYLES} />}
    </>
  );
}

interface SettingSectionViewProps {
  section: SettingSection;
}

function SettingSectionView({ section }: SettingSectionViewProps): React.ReactElement {
  return (
    <View className={SECTION_CONTAINER_STYLES}>
      <View className={SECTION_HEADER_STYLES}>
        <Caption className="uppercase tracking-wider font-semibold">{section.title}</Caption>
      </View>
      <View className={ITEM_CONTAINER_STYLES}>
        {section.items.map((item, index) => (
          <SettingItemRow key={item.id} item={item} isLast={index === section.items.length - 1} />
        ))}
      </View>
    </View>
  );
}

interface PermissionStatusBadgeProps {
  state: PermissionState;
}

function PermissionStatusBadge({ state }: PermissionStatusBadgeProps): React.ReactElement {
  const statusConfig: Record<
    PermissionState,
    { label: string; bgClass: string; textClass: string }
  > = {
    granted: { label: 'Enabled', bgClass: 'bg-success-50', textClass: 'text-success-600' },
    denied: { label: 'Denied', bgClass: 'bg-error-50', textClass: 'text-error-500' },
    blocked: { label: 'Blocked', bgClass: 'bg-error-50', textClass: 'text-error-500' },
    unknown: { label: 'Unknown', bgClass: 'bg-gray-100', textClass: 'text-text-secondary' },
    checking: { label: 'Checking...', bgClass: 'bg-gray-100', textClass: 'text-text-secondary' },
  };

  const config = statusConfig[state];

  return (
    <View className={`px-2.5 py-1 rounded-full ${config.bgClass}`}>
      <Caption size="sm" muted={false} className={config.textClass}>
        {config.label}
      </Caption>
    </View>
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

  const handleAccountsPress = useCallback(() => {
    router.push('/settings/accounts');
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
          id: 'accounts',
          icon: '🏦',
          title: 'Bank Accounts',
          description: 'Manage your linked accounts',
          onPress: handleAccountsPress,
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
      backgroundColor={colors.background.primary}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <View className="px-4 pt-4 pb-2">
        <Heading level="h2">{'Settings'}</Heading>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pt-2 pb-8"
      >
        {sections.map((section) => (
          <SettingSectionView key={section.title} section={section} />
        ))}

        <View className={VERSION_STYLES}>
          <Caption>{'Monea v1.0.0'}</Caption>
          <Caption size="sm" className="mt-1">
            {'Made with ❤️ in Colombia'}
          </Caption>
        </View>
      </ScrollView>
    </Screen>
  );
}
