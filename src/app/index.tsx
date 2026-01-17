import { View, Text } from 'react-native';

export default function HomeScreen(): React.ReactElement {
  return (
    <View className="flex-1 items-center justify-center bg-background-primary">
      <Text className="text-4xl font-bold text-primary-600 mb-2">Monea</Text>
      <Text className="text-base text-text-secondary">Your digital wallet</Text>
    </View>
  );
}
