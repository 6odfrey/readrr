import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  avatarUrl?: string | null;
  username: string;
  size?: number;
}

export default function Avatar({ avatarUrl, username, size = 40 }: AvatarProps) {
  const getColorFromUsername = (username: string) => {
    const colors = [
      '#38B6FF', // blue
      '#10B981', // green
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#38B6FF', // indigo
      '#EF4444', // red
      '#F59E0B', // yellow
      '#14B8A6', // teal
    ];

    const hash = username.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  const firstLetter = username.charAt(0).toUpperCase();
  const backgroundColor = getColorFromUsername(username);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: size * 0.45,
        }}
      >
        {firstLetter}
      </Text>
    </View>
  );
}
