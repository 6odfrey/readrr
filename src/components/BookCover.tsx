import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface Props {
  coverUrl: string | null | undefined;
  width: number;
  height: number;
  style?: any;
  contentFit?: 'cover' | 'contain';
}

export default function BookCover({ coverUrl, width, height, style, contentFit = 'cover' }: Props) {
  if (!coverUrl) {
    return (
      <View
        style={[{ width, height, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }, style]}
      >
        <Text style={{ fontSize: Math.min(width, height) * 0.4 }}>📚</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: coverUrl }}
      style={[{ width, height }, style]}
      contentFit={contentFit}
    />
  );
}
