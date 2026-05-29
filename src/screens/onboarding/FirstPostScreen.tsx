import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { fetchBookByISBN, BookInfo } from '../../services/booksService';
import BookCover from '../../components/BookCover';

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 16,
    marginBottom: 16,
  },
});

interface Props {
  navigation: any;
}

export default function FirstPostScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [manualIsbn, setManualIsbn] = useState('');
  const [fetchingManual, setFetchingManual] = useState(false);
  const { user, setHasPosted } = useAuthStore();

  // Camera permission screen (only shown when trying to scan)
  const renderCameraPermissionScreen = () => (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-xl font-bold mb-4">Camera Access Needed</Text>
      <Text className="text-gray-500 text-center mb-6">
        We need camera access to scan book barcodes
      </Text>
      <TouchableOpacity
        onPress={requestPermission}
        className="bg-primary px-8 py-4 rounded-xl mb-4"
      >
        <Text className="text-white font-semibold">Grant Permission</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowCamera(false)}>
        <Text className="text-gray-500">Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  const lookupBook = async (isbn: string) => {
    try {
      const book = await fetchBookByISBN(isbn);
      setBookInfo(book);
      setShowCamera(false);
      return true;
    } catch (error) {
      console.error('Error fetching book:', error);
      return false;
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const found = await lookupBook(data);
    if (!found) {
      Alert.alert('Book Not Found', 'Try scanning again or enter manually');
      setScanned(false);
    }
  };

  const handleManualIsbnLookup = async () => {
    const isbn = manualIsbn.trim().replace(/-/g, '');
    if (!isbn) {
      Alert.alert('Error', 'Please enter an ISBN');
      return;
    }

    setFetchingManual(true);
    const found = await lookupBook(isbn);
    setFetchingManual(false);

    if (!found) {
      Alert.alert('Book Not Found', 'Please check the ISBN and try again');
    }
  };

  const handlePostBook = async () => {
    if (!bookInfo || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        post_type: 'social',
        social_type: 'currently_reading',
        title: bookInfo.title,
        author: bookInfo.author,
        isbn: bookInfo.isbn,
        cover_image_url: bookInfo.cover_image_url,
      });

      if (error) throw error;

      // Update hasPosted state - RootNavigator will automatically switch to MainNavigator
      setHasPosted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Book confirmation screen
  if (bookInfo) {
    return (
      <SafeAreaView className="flex-1 bg-white px-6">
        <Text className="text-2xl font-bold mt-8 mb-6">Your First Book!</Text>

        <View className="flex-row bg-gray-50 rounded-xl p-4 mb-6">
          <BookCover
            coverUrl={bookInfo.cover_image_url}
            width={80}
            height={120}
            style={{ borderRadius: 8, marginRight: 16 }}
          />
          <View className="flex-1 justify-center">
            <Text className="text-xl font-semibold mb-2">{bookInfo.title}</Text>
            <Text className="text-gray-500">{bookInfo.author}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handlePostBook}
          disabled={loading}
          className={`py-4 rounded-xl ${loading ? 'bg-gray-300' : 'bg-primary'}`}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? 'Posting...' : 'Post This Book'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setBookInfo(null);
            setScanned(false);
            setManualIsbn('');
          }}
          className="mt-4"
        >
          <Text className="text-primary text-center">Choose Different Book</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Camera view with cancel button
  if (showCamera) {
    if (!permission) {
      return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center">
          <Text>Requesting camera permission...</Text>
        </SafeAreaView>
      );
    }

    if (!permission.granted) {
      return renderCameraPermissionScreen();
    }

    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="absolute top-16 left-0 right-0 z-10 px-6">
          <Text className="text-white text-2xl font-bold text-center">
            Scan Your First Book
          </Text>
          <Text className="text-white/70 text-center mt-2">
            Point camera at the barcode
          </Text>
        </View>

        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        <TouchableOpacity
          onPress={() => {
            setShowCamera(false);
            setScanned(false);
          }}
          className="absolute bottom-12 left-0 right-0 items-center"
        >
          <View className="bg-white/90 px-8 py-4 rounded-full">
            <Text className="text-black font-semibold text-lg">Cancel</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Initial choice screen - scan or enter ISBN
  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 mb-4">
        <Text className="text-primary text-base">← Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold mb-2">Add Your First Book</Text>
      <Text className="text-gray-500 mb-8">
        Share what you're currently reading to get started
      </Text>

      {/* Scan Barcode Option */}
      <TouchableOpacity
        onPress={() => setShowCamera(true)}
        className="bg-primary py-4 rounded-xl mb-4"
      >
        <Text className="text-white text-center font-semibold text-lg">
          Scan Barcode
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center my-4">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="mx-4 text-gray-400">or</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      {/* Manual ISBN Input */}
      <Text className="text-gray-700 font-medium mb-2">Enter ISBN manually</Text>
      <TextInput
        value={manualIsbn}
        onChangeText={setManualIsbn}
        placeholder="e.g. 978-0-13-468599-1"
        keyboardType="numeric"
        style={styles.textInput}
        autoCapitalize="none"
      />
      <TouchableOpacity
        onPress={handleManualIsbnLookup}
        disabled={fetchingManual || !manualIsbn.trim()}
        className={`py-4 rounded-xl border ${
          fetchingManual || !manualIsbn.trim()
            ? 'bg-gray-100 border-gray-200'
            : 'bg-white border-primary'
        }`}
      >
        <Text
          className={`text-center font-semibold ${
            fetchingManual || !manualIsbn.trim() ? 'text-gray-400' : 'text-primary'
          }`}
        >
          {fetchingManual ? 'Looking up...' : 'Look Up Book'}
        </Text>
      </TouchableOpacity>

      {/* Test ISBN hint for dev */}
      {__DEV__ && (
        <Text className="text-gray-400 text-xs text-center mt-4">
          Test ISBN: 9780134685991 (Effective Java)
        </Text>
      )}
    </SafeAreaView>
  );
}
