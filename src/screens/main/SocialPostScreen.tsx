import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import BarcodeScanner from '../../components/BarcodeScanner';
import BookCover from '../../components/BookCover';
import { fetchBookByISBN, BookInfo } from '../../services/booksService';
import { createPost } from '../../services/postsService';
import { useAuthStore } from '../../store/authStore';

interface Props {
  navigation: any;
}

export default function SocialPostScreen({ navigation }: Props) {
  const session = useAuthStore((state) => state.session);

  const [showScanner, setShowScanner] = useState(false);
  const [showManualIsbn, setShowManualIsbn] = useState(false);
  const [manualIsbn, setManualIsbn] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [book, setBook] = useState<BookInfo | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBarcodeScanned = async (isbn: string) => {
    setShowScanner(false);

    try {
      const bookData = await fetchBookByISBN(isbn);
      setBook(bookData);
    } catch (error) {
      Alert.alert('Book Not Found', 'Could not find book with that ISBN');
    }
  };

  const handleManualIsbnSubmit = async () => {
    const isbn = manualIsbn.trim().replace(/-/g, '');
    if (!isbn) {
      Alert.alert('Error', 'Please enter an ISBN');
      return;
    }

    setLookingUp(true);
    try {
      const bookData = await fetchBookByISBN(isbn);
      setBook(bookData);
      setShowManualIsbn(false);
      setManualIsbn('');
    } catch (error) {
      Alert.alert('Book Not Found', 'Could not find book with that ISBN');
    } finally {
      setLookingUp(false);
    }
  };

  const handlePost = async () => {
    if (!book || !session) {
      Alert.alert('Error', 'Please select a book');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Creating post with cover_image_url:', book.cover_image_url);

      await createPost({
        user_id: session.user.id,
        post_type: 'social',
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        cover_image_url: book.cover_image_url,
        caption: caption || null,
      });

      navigation.navigate('MainTabs', { screen: 'Feed' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (showScanner) {
    return (
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onCancel={() => setShowScanner(false)}
        title="Scan Book Barcode"
      />
    );
  }

  if (showManualIsbn) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6">
          <TouchableOpacity onPress={() => setShowManualIsbn(false)} className="mt-4 mb-8">
            <Text className="text-primary text-base">← Back</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold mb-2">Enter ISBN</Text>
          <Text className="text-gray-500 mb-8">
            Find the ISBN on the back of the book near the barcode
          </Text>

          <TextInput
            value={manualIsbn}
            onChangeText={setManualIsbn}
            placeholder="e.g. 978-0-13-468599-1"
            keyboardType="numeric"
            style={styles.isbnInput}
            autoCapitalize="none"
            editable={!lookingUp}
          />

          <TouchableOpacity
            onPress={handleManualIsbnSubmit}
            disabled={!manualIsbn.trim() || lookingUp}
            className={`py-4 rounded-xl ${
              manualIsbn.trim() && !lookingUp ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            {lookingUp ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                Look Up Book
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
            <Text className="text-gray-500 text-center">Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="px-6 pt-4">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
              <Text className="text-primary text-base">← Back</Text>
            </TouchableOpacity>

            <Text className="text-2xl font-bold mb-6">Share What You're Reading</Text>

            {/* Book Selection */}
            {book ? (
              <View className="flex-row mb-6 bg-gray-50 rounded-xl p-4">
                <BookCover
                  coverUrl={book.cover_image_url}
                  width={60}
                  height={90}
                  style={{ borderRadius: 4, marginRight: 16 }}
                />
                <View className="flex-1 justify-center">
                  <Text className="font-semibold text-base" style={{ marginBottom: 4 }}>{book.title}</Text>
                  <Text className="text-gray-600 text-sm">{book.author}</Text>
                  <TouchableOpacity onPress={() => setBook(null)} className="mt-2">
                    <Text className="text-primary text-sm">Change book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="mb-6">
                <TouchableOpacity
                  onPress={() => setShowScanner(true)}
                  className="bg-primary py-4 rounded-xl mb-3"
                >
                  <Text className="text-white text-center font-semibold">
                    Scan Barcode
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowManualIsbn(true)}
                  className="border border-primary py-4 rounded-xl"
                >
                  <Text className="text-primary text-center font-semibold">
                    Enter ISBN Manually
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Caption */}
            <Text className="text-sm font-semibold mb-2">Caption (optional)</Text>
            <TextInput
              placeholder="What do you think about this book?"
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={styles.textArea}
            />
            <Text className="text-gray-400 text-xs text-right mb-6">
              {caption.length}/500
            </Text>

            {/* Post Button */}
            <TouchableOpacity
              onPress={handlePost}
              disabled={!book || loading}
              className={`py-4 rounded-xl ${
                !book || loading ? 'bg-gray-300' : 'bg-primary'
              }`}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {loading ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  isbnInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
  },
});
