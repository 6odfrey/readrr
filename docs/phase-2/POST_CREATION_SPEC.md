# Phase 2: Post Creation Implementation

**For:** Claude Code  
**Purpose:** Complete code for creating social & swap posts

---

## 📋 Overview

Users can create two types of posts:
1. **Social Post** - Share what they're reading (quick)
2. **Swap Post** - Book available to swap (detailed)

---

## 🎯 Flow

```
CreatePostScreen (choose type)
    ↓
[Social Post] → SocialPostScreen → Save to database → Back to Feed
    ↓
[Swap Post] → SwapPostScreen → Barcode + Image + Details → Save → Back to Swaps tab
```

---

## 🗂️ Files to Create

1. `src/screens/main/CreatePostScreen.tsx` - Choose post type
2. `src/screens/main/SocialPostScreen.tsx` - Social post creation
3. `src/screens/main/SwapPostScreen.tsx` - Swap post creation
4. `src/components/BarcodeScanner.tsx` - Reusable scanner
5. `src/services/postsService.ts` - Post CRUD
6. `src/services/storageService.ts` - Expand for post images

---

## 📱 Screen 1: CreatePostScreen

**Purpose:** Let user choose post type

```typescript
// src/screens/main/CreatePostScreen.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function CreatePostScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-20">
        <Text className="text-3xl font-bold mb-8">Create Post</Text>
        
        {/* Social Post Option */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SocialPost')}
          className="bg-blue-500 rounded-xl p-6 mb-4"
        >
          <Text className="text-white text-xl font-bold mb-2">
            📖 Social Post
          </Text>
          <Text className="text-white text-sm opacity-90">
            Share what you're currently reading
          </Text>
        </TouchableOpacity>
        
        {/* Swap Post Option */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SwapPost')}
          className="bg-green-500 rounded-xl p-6"
        >
          <Text className="text-white text-xl font-bold mb-2">
            🔄 Swap Post
          </Text>
          <Text className="text-white text-sm opacity-90">
            Post a book available to swap
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-8"
        >
          <Text className="text-gray-500 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 📱 Screen 2: SocialPostScreen

**Purpose:** Quick social post creation

```typescript
// src/screens/main/SocialPostScreen.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import BarcodeScanner from '../../components/BarcodeScanner';
import { fetchBookByISBN } from '../../services/booksService';
import { createPost } from '../../services/postsService';
import { useAuthStore } from '../../store/authStore';

export default function SocialPostScreen({ navigation }) {
  const session = useAuthStore(state => state.session);
  
  const [showScanner, setShowScanner] = useState(false);
  const [book, setBook] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBarcodeScanned = async (isbn: string) => {
    setShowScanner(false);
    
    try {
      const bookData = await fetchBookByISBN(isbn);
      setBook(bookData);
    } catch (error) {
      Alert.alert('Error', 'Could not find book');
    }
  };

  const handleManualEntry = () => {
    // Show modal for manual title/author entry
    Alert.prompt(
      'Enter Book Title',
      '',
      (title) => {
        if (title) {
          Alert.prompt(
            'Enter Author',
            '',
            (author) => {
              setBook({
                isbn: null,
                title,
                author: author || 'Unknown',
                cover_url: null,
              });
            }
          );
        }
      }
    );
  };

  const handlePost = async () => {
    if (!book) {
      Alert.alert('Error', 'Please select a book');
      return;
    }
    
    setLoading(true);
    
    try {
      await createPost({
        user_id: session!.user.id,
        post_type: 'social',
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
        caption,
      });
      
      navigation.navigate('MainTabs', { screen: 'Feed' });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showScanner) {
    return (
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onCancel={() => setShowScanner(false)}
        onManualEntry={handleManualEntry}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold mb-6">Share What You're Reading</Text>
        
        {/* Book Selection */}
        {book ? (
          <View className="flex-row mb-6 bg-gray-50 rounded-lg p-4">
            {book.cover_url && (
              <Image
                source={{ uri: book.cover_url }}
                style={{ width: 60, height: 90 }}
                className="rounded mr-4"
              />
            )}
            <View className="flex-1">
              <Text className="font-semibold text-base mb-1">{book.title}</Text>
              <Text className="text-gray-600 text-sm">{book.author}</Text>
              <TouchableOpacity onPress={() => setBook(null)} className="mt-2">
                <Text className="text-blue-500 text-sm">Change book</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="mb-6">
            <TouchableOpacity
              onPress={() => setShowScanner(true)}
              className="bg-blue-500 py-4 rounded-lg mb-3"
            >
              <Text className="text-white text-center font-semibold">
                Scan Barcode
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleManualEntry}
              className="border border-blue-500 py-4 rounded-lg"
            >
              <Text className="text-blue-500 text-center font-semibold">
                Enter Manually
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Caption (Optional) */}
        <Text className="text-sm font-semibold mb-2">
          Caption (optional)
        </Text>
        <TextInput
          placeholder="What do you think about this book?"
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
          maxLength={500}
          className="border border-gray-300 rounded-lg p-4 mb-6 text-base"
          style={{ minHeight: 100 }}
        />
        
        {/* Post Button */}
        <TouchableOpacity
          onPress={handlePost}
          disabled={!book || loading}
          className={`py-4 rounded-lg ${
            !book || loading ? 'bg-gray-300' : 'bg-blue-500'
          }`}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="py-4"
        >
          <Text className="text-gray-500 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

---

## 📱 Screen 3: SwapPostScreen

**Purpose:** Detailed swap post with image + condition + details

```typescript
// src/screens/main/SwapPostScreen.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import BarcodeScanner from '../../components/BarcodeScanner';
import { fetchBookByISBN } from '../../services/booksService';
import { createPost } from '../../services/postsService';
import { uploadPostImage } from '../../services/storageService';
import { useAuthStore } from '../../store/authStore';

export default function SwapPostScreen({ navigation }) {
  const session = useAuthStore(state => state.session);
  
  const [showScanner, setShowScanner] = useState(false);
  const [book, setBook] = useState<any>(null);
  const [bookImage, setBookImage] = useState<{ uri: string } | null>(null);
  const [condition, setCondition] = useState('');
  const [genre, setGenre] = useState('');
  const [swapType, setSwapType] = useState<'trade' | 'borrow' | 'gift'>('trade');
  const [loading, setLoading] = useState(false);

  const handleBarcodeScanned = async (isbn: string) => {
    setShowScanner(false);
    try {
      const bookData = await fetchBookByISBN(isbn);
      setBook(bookData);
    } catch (error) {
      Alert.alert('Error', 'Could not find book');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed to access photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setBookImage({ uri: result.assets[0].uri });
    }
  };

  const handlePost = async () => {
    if (!book || !bookImage || !condition || !genre) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get user's location
      const { status } = await Location.requestForegroundPermissionsAsync();
      let location = null;
      
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        location = {
          type: 'Point',
          coordinates: [loc.coords.longitude, loc.coords.latitude]
        };
      }
      
      // Upload image
      const imageUrl = await uploadPostImage(bookImage.uri, session!.user.id);
      
      // Create post
      await createPost({
        user_id: session!.user.id,
        post_type: 'swap',
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
        image_url: imageUrl,
        condition,
        genre,
        swap_type: swapType,
        availability: 'available',
        location,
      });
      
      navigation.navigate('MainTabs', { screen: 'Swaps' });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showScanner) {
    return (
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onCancel={() => setShowScanner(false)}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-10">
        <Text className="text-2xl font-bold mb-6">Post Book for Swap</Text>
        
        {/* Book Info */}
        {book ? (
          <View className="mb-6">
            <Text className="text-sm font-semibold mb-2">Book</Text>
            <View className="flex-row bg-gray-50 rounded-lg p-4">
              {book.cover_url && (
                <Image source={{ uri: book.cover_url }} style={{ width: 60, height: 90 }} className="rounded mr-4" />
              )}
              <View className="flex-1">
                <Text className="font-semibold">{book.title}</Text>
                <Text className="text-gray-600 text-sm">{book.author}</Text>
                <TouchableOpacity onPress={() => setBook(null)}>
                  <Text className="text-blue-500 text-sm mt-2">Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View className="mb-6">
            <TouchableOpacity onPress={() => setShowScanner(true)} className="bg-blue-500 py-4 rounded-lg">
              <Text className="text-white text-center font-semibold">Scan Book Barcode</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Book Photo */}
        <Text className="text-sm font-semibold mb-2">Photo of Book *</Text>
        <TouchableOpacity onPress={pickImage} className="mb-6">
          {bookImage ? (
            <Image source={{ uri: bookImage.uri }} style={{ width: '100%', height: 200 }} className="rounded-lg" />
          ) : (
            <View className="w-full h-48 bg-gray-200 rounded-lg items-center justify-center">
              <Text className="text-gray-500 text-4xl mb-2">📷</Text>
              <Text className="text-gray-500">Add photo of your book</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Condition */}
        <Text className="text-sm font-semibold mb-2">Condition *</Text>
        <View className="flex-row flex-wrap mb-6">
          {['new', 'like_new', 'good', 'acceptable', 'poor'].map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCondition(c)}
              className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                condition === c ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <Text className={condition === c ? 'text-white' : 'text-gray-700'}>
                {c.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Genre */}
        <Text className="text-sm font-semibold mb-2">Genre *</Text>
        <View className="flex-row flex-wrap mb-6">
          {['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'Self-Help'].map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGenre(g)}
              className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                genre === g ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <Text className={genre === g ? 'text-white' : 'text-gray-700'}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Swap Type */}
        <Text className="text-sm font-semibold mb-2">I want to *</Text>
        <View className="flex-row mb-6">
          <TouchableOpacity
            onPress={() => setSwapType('trade')}
            className={`flex-1 py-3 rounded-lg mr-2 ${
              swapType === 'trade' ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <Text className={`text-center font-semibold ${swapType === 'trade' ? 'text-white' : 'text-gray-700'}`}>
              Trade
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setSwapType('borrow')}
            className={`flex-1 py-3 rounded-lg mr-2 ${
              swapType === 'borrow' ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <Text className={`text-center font-semibold ${swapType === 'borrow' ? 'text-white' : 'text-gray-700'}`}>
              Lend
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setSwapType('gift')}
            className={`flex-1 py-3 rounded-lg ${
              swapType === 'gift' ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          >
            <Text className={`text-center font-semibold ${swapType === 'gift' ? 'text-white' : 'text-gray-700'}`}>
              Gift
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Post Button */}
        <TouchableOpacity
          onPress={handlePost}
          disabled={!book || !bookImage || !condition || !genre || loading}
          className={`py-4 rounded-lg ${
            !book || !bookImage || !condition || !genre || loading
              ? 'bg-gray-300'
              : 'bg-green-500'
          }`}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? 'Posting...' : 'Post to Swaps'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.goBack()} className="py-4">
          <Text className="text-gray-500 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

---

## 🔧 Component: Reusable BarcodeScanner

**File:** `src/components/BarcodeScanner.tsx`

```typescript
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BarCodeScannedCallback } from 'expo-camera';

interface Props {
  onBarcodeScanned: (isbn: string) => void;
  onCancel: () => void;
  onManualEntry?: () => void;
}

export default function BarcodeScanner({ onBarcodeScanned, onCancel, onManualEntry }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-xl font-bold mb-4 text-center">Camera Permission Required</Text>
        <Text className="text-gray-600 mb-6 text-center">
          We need camera access to scan book barcodes
        </Text>
        <TouchableOpacity onPress={requestPermission} className="bg-blue-500 py-4 px-8 rounded-lg mb-4">
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel}>
          <Text className="text-gray-500">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned: BarCodeScannedCallback = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    onBarcodeScanned(data);
  };

  return (
    <View className="flex-1">
      <CameraView
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8'],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Overlay */}
      <View className="flex-1 justify-between">
        {/* Top bar */}
        <View className="bg-black/50 px-6 py-4 pt-12">
          <Text className="text-white text-xl font-bold">Scan Book Barcode</Text>
          <Text className="text-white/80 text-sm mt-1">
            Position barcode in camera view
          </Text>
        </View>
        
        {/* Bottom buttons */}
        <View className="bg-black/50 px-6 py-6 pb-12">
          {onManualEntry && (
            <TouchableOpacity
              onPress={onManualEntry}
              className="bg-white py-4 rounded-lg mb-3"
            >
              <Text className="text-black text-center font-semibold">
                Enter Manually
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={onCancel} className="py-4">
            <Text className="text-white text-center font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
```

---

## 🛠️ Service: Posts Service

**File:** `src/services/postsService.ts`

```typescript
import { supabase } from '../config/supabase';

export interface CreatePostData {
  user_id: string;
  post_type: 'social' | 'swap';
  isbn?: string | null;
  title: string;
  author?: string | null;
  cover_url?: string | null;
  image_url?: string | null;
  condition?: string | null;
  genre?: string | null;
  swap_type?: 'trade' | 'borrow' | 'gift' | null;
  availability?: 'available' | 'pending' | 'swapped';
  location?: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  caption?: string;
}

export async function createPost(data: CreatePostData) {
  const { error } = await supabase
    .from('posts')
    .insert(data);
  
  if (error) throw error;
}

export async function getUserPosts(userId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(username, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function deletePost(postId: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  
  if (error) throw error;
}
```

---

## 🛠️ Service: Storage Service (Expand)

**File:** `src/services/storageService.ts`

```typescript
import { supabase } from '../config/supabase';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Avatar upload (from Phase 1)
export async function uploadAvatar(uri: string, userId: string): Promise<string> {
  const compressed = await compressImage(uri, 3); // 3MB max
  const filePath = `${userId}/avatar.jpg`;
  
  const response = await fetch(compressed.uri);
  const blob = await response.blob();
  
  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });
  
  if (error) throw error;
  
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}

// Post image upload (NEW for Phase 2)
export async function uploadPostImage(uri: string, userId: string): Promise<string> {
  const compressed = await compressImage(uri, 5); // 5MB max for posts
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.jpg`;
  
  const response = await fetch(compressed.uri);
  const blob = await response.blob();
  
  const { error } = await supabase.storage
    .from('post-images')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });
  
  if (error) throw error;
  
  const { data } = supabase.storage.from('post-images').getPublicUrl(filePath);
  return data.publicUrl;
}

// Image compression helper
async function compressImage(uri: string, maxSizeMB: number) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (blob.size > maxBytes) {
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    return manipResult;
  }
  
  return { uri };
}
```

---

## ✅ Testing Checklist

**Social Post Creation:**
- [ ] Can choose "Social Post" from CreatePostScreen
- [ ] Can scan barcode
- [ ] Can enter book manually
- [ ] Book info displays correctly
- [ ] Can add optional caption (max 500 chars)
- [ ] Post button disabled until book selected
- [ ] Creates post in database with post_type='social'
- [ ] Redirects to Feed tab after posting
- [ ] New post appears in feed

**Swap Post Creation:**
- [ ] Can choose "Swap Post" from CreatePostScreen
- [ ] Can scan barcode
- [ ] Can pick image from library
- [ ] Image compresses if > 5MB
- [ ] Can select condition (all 5 options)
- [ ] Can select genre (all 8 options)
- [ ] Can toggle swap type (trade/borrow/gift)
- [ ] Post button disabled until all required fields filled
- [ ] Requests location permission
- [ ] Uploads image to post-images bucket
- [ ] Creates post with post_type='swap'
- [ ] Redirects to Swaps tab after posting
- [ ] New swap appears in swaps tab

**Barcode Component:**
- [ ] Requests camera permission
- [ ] Scans EAN-13 and EAN-8 barcodes
- [ ] Calls onBarcodeScanned with ISBN
- [ ] Can cancel and go back
- [ ] Shows manual entry option
- [ ] Works from both SocialPost and SwapPost screens

---

## 🐛 Common Issues

**Issue:** Barcode not scanning  
**Fix:** Test on physical device (doesn't work in simulator), ensure good lighting

**Issue:** Image upload fails  
**Fix:** Check post-images bucket exists, verify policies, check file size

**Issue:** Location permission denied  
**Fix:** Handle gracefully, allow posting without location (show city-wide)

**Issue:** Condition buttons overlap on small screens  
**Fix:** Use flex-wrap, adjust spacing

---

**Post creation complete! Test thoroughly before moving to FEED_SPEC.md** ✅
