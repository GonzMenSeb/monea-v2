import { useCallback } from 'react';

import { Pressable, ScrollView, Linking } from 'react-native';

import ExpoConstants from 'expo-constants';
import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/shared/components/layout';
import { Heading, Body, Caption } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

const Header = styled(XStack, {
  name: 'Header',
  paddingHorizontal: '$4',
  paddingTop: '$4',
  paddingBottom: '$2',
  alignItems: 'center',
});

const BackButton = styled(XStack, {
  name: 'BackButton',
  alignItems: 'center',
  gap: '$1',
  flex: 1,
});

const ContentContainer = styled(YStack, {
  name: 'ContentContainer',
  padding: '$4',
  gap: '$4',
});

const Card = styled(YStack, {
  name: 'Card',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$3',
});

const LogoContainer = styled(YStack, {
  name: 'LogoContainer',
  alignItems: 'center',
  paddingVertical: '$6',
});

const InfoRow = styled(XStack, {
  name: 'InfoRow',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: '$2',
});

const Divider = styled(Stack, {
  name: 'Divider',
  height: 1,
  backgroundColor: '$border',
});

const LinkRow = styled(XStack, {
  name: 'LinkRow',
  alignItems: 'center',
  paddingVertical: '$3',
});

export default function AboutScreen(): React.ReactElement {
  const router = useRouter();

  const appVersion = ExpoConstants.expoConfig?.version ?? '1.0.0';
  const buildNumber = ExpoConstants.expoConfig?.android?.versionCode ?? '1';

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleOpenWebsite = useCallback(() => {
    void Linking.openURL('https://monea.app');
  }, []);

  const handleOpenGithub = useCallback(() => {
    void Linking.openURL('https://github.com/monea-app');
  }, []);

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <Header>
        <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          {({ pressed }) => (
            <BackButton opacity={pressed ? 0.7 : 1}>
              <Text color="$accentPrimary" fontSize="$5">
                ‹
              </Text>
              <Body color="$accentPrimary">Back</Body>
            </BackButton>
          )}
        </Pressable>
        <Heading level="h3">About</Heading>
        <XStack flex={1} />
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ContentContainer>
          <LogoContainer>
            <Text fontSize={64}>💰</Text>
            <Heading level="h2" marginTop="$2">
              Monea
            </Heading>
            <Caption color="$textSecondary" marginTop="$1">
              Your personal finance companion
            </Caption>
          </LogoContainer>

          <Card>
            <Body fontWeight="600">App Information</Body>
            <InfoRow>
              <Caption color="$textSecondary">Version</Caption>
              <Body>{appVersion}</Body>
            </InfoRow>
            <Divider />
            <InfoRow>
              <Caption color="$textSecondary">Build</Caption>
              <Body>{buildNumber}</Body>
            </InfoRow>
          </Card>

          <Card>
            <Body fontWeight="600">About Monea</Body>
            <Caption color="$textSecondary" lineHeight={20}>
              Monea is a personal finance app designed specifically for Colombian users. It
              automatically tracks your bank transactions by reading SMS notifications from your
              financial institutions.
            </Caption>
            <Caption color="$textSecondary" lineHeight={20} marginTop="$2">
              Your data stays private and secure on your device. We never upload your financial
              information to any server.
            </Caption>
          </Card>

          <Card>
            <Body fontWeight="600">Links</Body>
            <Pressable onPress={handleOpenWebsite}>
              {({ pressed }) => (
                <LinkRow opacity={pressed ? 0.7 : 1}>
                  <Text fontSize="$3" marginRight="$2">
                    🌐
                  </Text>
                  <Body color="$accentPrimary">Website</Body>
                </LinkRow>
              )}
            </Pressable>
            <Divider />
            <Pressable onPress={handleOpenGithub}>
              {({ pressed }) => (
                <LinkRow opacity={pressed ? 0.7 : 1}>
                  <Text fontSize="$3" marginRight="$2">
                    💻
                  </Text>
                  <Body color="$accentPrimary">GitHub</Body>
                </LinkRow>
              )}
            </Pressable>
          </Card>

          <YStack alignItems="center" paddingTop="$4">
            <Caption color="$textMuted">Made with ❤️ in Colombia</Caption>
            <Caption color="$textMuted" fontSize="$1" marginTop="$1">
              © 2024 Monea
            </Caption>
          </YStack>
        </ContentContainer>
      </ScrollView>
    </Screen>
  );
}
