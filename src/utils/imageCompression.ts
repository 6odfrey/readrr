import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

export const compressImage = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    if (blob.size <= MAX_FILE_SIZE) {
      return uri;
    }

    // Compress if over 3MB
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );

    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri;
  }
};

export const getFileSizeInMB = async (uri: string): Promise<number> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size / (1024 * 1024);
  } catch {
    return 0;
  }
};
