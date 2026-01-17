import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout(): React.ReactElement {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}
