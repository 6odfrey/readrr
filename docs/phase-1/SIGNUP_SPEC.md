# Phase 1: Sign-Up Implementation

**For:** Claude Code  
**Purpose:** Complete 2-step sign-up with @username + avatar

---

## 📋 Requirements

### **Step 1: Credentials**
- Email input (lowercase, validated)
- Password input (min 8 characters, secure entry)
- Continue button

### **Step 2: Profile**
- Username input (@username format, lowercase only, 3-20 chars)
- Real-time username validation (check if taken)
- Avatar picker (optional, max 3MB)
- Default avatar: Colored circle with first letter
- Create Account button

### **Validation Rules:**
- **Email:** Valid email format
- **Password:** Minimum 8 characters
- **Username:** 
  - 3-20 characters
  - Lowercase only
  - Letters, numbers, underscores only (a-z, 0-9, _)
  - Must be unique (check database)
  - No @ symbol stored (just displayed)

### **Error Handling:**
- Show inline errors as user types
- Disable buttons when invalid
- Handle network errors gracefully
- Show loading states during API calls

---

## 🎯 Implementation

### **File:** `src/screens/auth/SignUpScreen.tsx`

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../../config/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SignUpScreen({ navigation }: Props) {
  // State
  const [step, setStep] = useState(1);
  
  // Step 1 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Step 2 fields
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<{ uri: string } | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // Loading
  const [loading, setLoading] = useState(false);

  // Validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleContinueToProfile = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    
    setStep(2);
  };

  // Username validation with debouncing
  const checkUsernameAvailability = async (username: string) => {
    if (!username) return;
    
    setCheckingUsername(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setUsernameError('Username already taken');
      } else {
        setUsernameError('');
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    // Remove @ and force lowercase
    const cleaned = text.replace('@', '').toLowerCase();
    setUsername(cleaned);
    
    // Validation
    if (cleaned.length === 0) {
      setUsernameError('');
      return;
    }
    
    if (cleaned.length < 3) {
      setUsernameError('Must be at least 3 characters');
      return;
    }
    
    if (cleaned.length > 20) {
      setUsernameError('Must be less than 20 characters');
      return;
    }
    
    if (!/^[a-z0-9_]+$/.test(cleaned)) {
      setUsernameError('Only lowercase letters, numbers, and underscores');
      return;
    }
    
    // Check availability (in real app, debounce this)
    checkUsernameAvailability(cleaned);
  };

  // Image picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const compressed = await compressImage(result.assets[0].uri);
      setAvatar(compressed);
    }
  };

  // Compress image to max 3MB
  const compressImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    if (blob.size > 3 * 1024 * 1024) {
      // Compress if over 3MB
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      
      return { uri: manipResult.uri };
    }
    
    return { uri };
  };

  // Sign up
  const handleSignUp = async () => {
    if (!username || usernameError || checkingUsername) return;
    
    setLoading(true);
    
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });
      
      if (authError) throw authError;
      
      if (!authData.user) throw new Error('No user returned');
      
      const userId = authData.user.id;
      
      // 2. Upload avatar if provided
      let avatarUrl: string | null = null;
      
      if (avatar) {
        const fileExt = 'jpg';
        const filePath = `${userId}/avatar.${fileExt}`;
        
        // Convert URI to blob
        const response = await fetch(avatar.uri);
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true,
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = urlData.publicUrl;
      }
      
      // 3. Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username,
          email: email.toLowerCase(),
          avatar_url: avatarUrl,
        });
      
      if (profileError) throw profileError;
      
      // Success - user will be redirected by navigation (has session but no posts)
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Credentials
  if (step === 1) {
    return (
      <ScrollView className="flex-1 bg-white">
        <View className="px-6 pt-20">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mb-8"
          >
            <Text className="text-blue-500 text-base">← Back</Text>
          </TouchableOpacity>
          
          <Text className="text-3xl font-bold mb-2">Create Account</Text>
          <Text className="text-gray-600 mb-8">Step 1 of 2</Text>
          
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={(text) => setEmail(text.toLowerCase())}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
          />
          
          <TextInput
            placeholder="Password (min 8 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
          />
          
          <TouchableOpacity
            onPress={handleContinueToProfile}
            className="bg-blue-500 py-4 rounded-lg"
          >
            <Text className="text-white text-center font-semibold text-lg">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // STEP 2: Profile
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-20">
        <TouchableOpacity
          onPress={() => setStep(1)}
          className="mb-8"
        >
          <Text className="text-blue-500 text-base">← Back</Text>
        </TouchableOpacity>
        
        <Text className="text-3xl font-bold mb-2">Create Profile</Text>
        <Text className="text-gray-600 mb-8">Step 2 of 2</Text>
        
        {/* Avatar Picker */}
        <TouchableOpacity
          onPress={pickImage}
          className="self-center mb-2"
        >
          {avatar ? (
            <Image
              source={{ uri: avatar.uri }}
              style={{ width: 96, height: 96 }}
              className="rounded-full"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
              <Text className="text-4xl">📷</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Text className="text-sm text-gray-500 text-center mb-1">
          Add photo (optional)
        </Text>
        <Text className="text-xs text-gray-400 text-center mb-8">
          Max 3MB
        </Text>
        
        {/* Username Input */}
        <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 mb-2">
          <Text className="text-lg text-gray-600 mr-1">@</Text>
          <TextInput
            placeholder="username"
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 text-base"
          />
          {checkingUsername && (
            <ActivityIndicator size="small" />
          )}
          {username && !usernameError && !checkingUsername && (
            <Text className="text-green-500 text-lg">✓</Text>
          )}
        </View>
        
        {usernameError ? (
          <Text className="text-red-500 text-sm mb-4">{usernameError}</Text>
        ) : (
          <Text className="text-gray-400 text-sm mb-4">
            Lowercase letters, numbers, and underscores only
          </Text>
        )}
        
        <TouchableOpacity
          onPress={handleSignUp}
          disabled={!username || !!usernameError || checkingUsername || loading}
          className={`py-4 rounded-lg ${
            !username || usernameError || checkingUsername || loading
              ? 'bg-gray-300'
              : 'bg-blue-500'
          }`}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
        
        <Text className="text-xs text-gray-500 text-center mt-6">
          You can add your city and bio later in settings
        </Text>
      </View>
    </ScrollView>
  );
}
```

---

## 🎨 Avatar Component

**File:** `src/components/Avatar.tsx`

```typescript
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  avatarUrl?: string | null;
  username: string;
  size?: number;
}

export default function Avatar({ avatarUrl, username, size = 40 }: AvatarProps) {
  // Generate consistent color from username
  const getColorFromUsername = (username: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
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
        style={{ width: size, height: size }}
        className="rounded-full"
      />
    );
  }

  // Default: colored circle with first letter
  const firstLetter = username.charAt(0).toUpperCase();
  const colorClass = getColorFromUsername(username);

  return (
    <View 
      className={`${colorClass} rounded-full items-center justify-center`}
      style={{ width: size, height: size }}
    >
      <Text 
        className="text-white font-bold"
        style={{ fontSize: size * 0.5 }}
      >
        {firstLetter}
      </Text>
    </View>
  );
}
```

---

## ✅ Testing Checklist

- [ ] Step 1: Can enter email and password
- [ ] Step 1: Validates email format
- [ ] Step 1: Requires password ≥ 8 characters
- [ ] Step 1: Can go back to Welcome
- [ ] Step 2: Username input removes @ symbol automatically
- [ ] Step 2: Username converts to lowercase
- [ ] Step 2: Username validation shows inline errors
- [ ] Step 2: Shows "taken" error for duplicate username
- [ ] Step 2: Shows ✓ for available username
- [ ] Step 2: Can pick image from library
- [ ] Step 2: Image compresses if > 3MB
- [ ] Step 2: Can sign up without avatar
- [ ] Step 2: Default avatar shows colored circle with letter
- [ ] Sign up creates auth user in Supabase
- [ ] Sign up creates profile in users table
- [ ] Sign up uploads avatar to storage
- [ ] After signup, redirects to FirstPost

---

## 🐛 Common Issues

**Issue:** Username check is slow
**Fix:** Add debouncing (wait 500ms after typing stops before checking)

**Issue:** Image upload fails
**Fix:** Check storage bucket exists, check policies, verify file size < 3MB

**Issue:** "User already exists" error
**Fix:** Check if email is already registered, show appropriate error

**Issue:** Avatar not showing after upload
**Fix:** Verify public URL is correct, check CORS settings in Supabase

---

**Implementation complete! Test thoroughly before moving to next section.**
