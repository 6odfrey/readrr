# UI Updates - Before Phase 3

**Changes:** Card shadows, new color scheme, banner/logo images, Heroicons

---

## 🎨 **1. Add Shadows to Feed Cards**

**File:** `src/screens/main/FeedScreen.tsx`

**Find:**
```typescript
<View style={{ width: CARD_WIDTH }} className="mb-4">
```

**Replace with:**
```typescript
<View 
  style={{ 
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,  // For Android
  }} 
  className="mb-4 bg-white rounded-lg"
>
```

---

## 🎨 **2. Update Color Scheme to #38B6FF**

**Global Find & Replace:**

Search for: `bg-blue-500`  
Replace with: `bg-[#38B6FF]`

Search for: `text-blue-500`  
Replace with: `text-[#38B6FF]`

Search for: `border-blue-500`  
Replace with: `border-[#38B6FF]`

Search for: `#3B82F6`  
Replace with: `#38B6FF`

**Files to check:**
- src/screens/auth/WelcomeScreen.tsx
- src/screens/auth/SignUpScreen.tsx
- src/screens/auth/SignInScreen.tsx
- src/screens/main/FeedScreen.tsx
- src/screens/main/CreatePostScreen.tsx
- src/screens/main/SocialPostScreen.tsx
- src/screens/main/SwapPostScreen.tsx
- src/components/PostCard.tsx
- src/navigation/MainStack.tsx (tab bar color)

**Tab Bar Update:**
```typescript
// In MainStack.tsx or wherever tabs are defined
screenOptions={{
  tabBarActiveTintColor: '#38B6FF',  // ← Update this
  tabBarInactiveTintColor: 'gray',
}}
```

---

## 🖼️ **3. Add Banner Image (Sign-In Pages)**

### **Setup:**
1. Place banner image in: `assets/images/banner.png`
2. Import at top of files:
```typescript
import { Image } from 'expo-image';
```

### **WelcomeScreen.tsx:**
**Find:**
```typescript
<Text className="text-3xl font-bold">Readrr</Text>
```

**Replace with:**
```typescript
<Image 
  source={require('../../../assets/images/banner.png')}
  style={{ width: 250, height: 80 }}
  contentFit="contain"
  className="mb-6"
/>
```

### **SignInScreen.tsx:**
**Same replacement where title appears**

### **SignUpScreen.tsx:**
**Same replacement where title appears**

---

## 🖼️ **4. Add Logo (Feed Header)**

### **Setup:**
1. Place logo in: `assets/images/logo.png`

### **Option A: Using Navigation Header**

**File:** `src/screens/main/FeedScreen.tsx`

```typescript
import { Image } from 'expo-image';
import { useLayoutEffect } from 'react';

export default function FeedScreen({ navigation }) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image 
          source={require('../../../assets/images/logo.png')}
          style={{ width: 120, height: 40 }}
          contentFit="contain"
        />
      ),
    });
  }, [navigation]);
  
  // rest of component...
}
```

### **Option B: Custom Header Component**

If you have a custom header:

```typescript
<View className="flex-row items-center justify-center py-4">
  <Image 
    source={require('../../assets/images/logo.png')}
    style={{ width: 120, height: 40 }}
    contentFit="contain"
  />
</View>
```

---

## 🎨 **5. Replace Icons with Heroicons**

### **Install:**
```bash
npm install react-native-heroicons react-native-svg
```

### **File:** `src/navigation/MainStack.tsx`

**Import at top:**
```typescript
// Outline icons (unfocused)
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  PlusCircleIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon 
} from 'react-native-heroicons/outline';

// Solid icons (focused)
import { 
  HomeIcon as HomeIconSolid, 
  MagnifyingGlassIcon as SearchIconSolid, 
  PlusCircleIcon as PlusIconSolid, 
  ChatBubbleLeftRightIcon as ChatIconSolid, 
  UserIcon as UserIconSolid 
} from 'react-native-heroicons/solid';
```

**Update each tab:**

```typescript
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#38B6FF',
    tabBarInactiveTintColor: '#9CA3AF',
  }}
>
  <Tab.Screen 
    name="Feed" 
    component={FeedScreen}
    options={{
      tabBarIcon: ({ focused, color, size }) => 
        focused 
          ? <HomeIconSolid color={color} size={size} /> 
          : <HomeIcon color={color} size={size} />
    }}
  />
  
  <Tab.Screen 
    name="Swaps" 
    component={SwapsScreen}
    options={{
      tabBarIcon: ({ focused, color, size }) => 
        focused 
          ? <SearchIconSolid color={color} size={size} /> 
          : <MagnifyingGlassIcon color={color} size={size} />
    }}
  />
  
  <Tab.Screen 
    name="Create" 
    component={CreatePostScreen}
    options={{
      tabBarIcon: ({ focused, color, size }) => 
        focused 
          ? <PlusIconSolid color={color} size={size} /> 
          : <PlusCircleIcon color={color} size={size} />
    }}
  />
  
  <Tab.Screen 
    name="Inbox" 
    component={InboxScreen}
    options={{
      tabBarIcon: ({ focused, color, size }) => 
        focused 
          ? <ChatIconSolid color={color} size={size} /> 
          : <ChatBubbleLeftRightIcon color={color} size={size} />
    }}
  />
  
  <Tab.Screen 
    name="Profile" 
    component={ProfileScreen}
    options={{
      tabBarIcon: ({ focused, color, size }) => 
        focused 
          ? <UserIconSolid color={color} size={size} /> 
          : <UserIcon color={color} size={size} />
    }}
  />
</Tab.Navigator>
```

---

## 📦 **Asset File Structure**

```
assets/
└── images/
    ├── banner.png      # For sign-in/welcome screens
    └── logo.png        # For feed header
```

**Recommended sizes:**
- Banner: 500×150px (wide, for title)
- Logo: 300×100px (horizontal logo)

---

## ✅ **Testing Checklist**

After making changes:

- [ ] Feed cards have subtle shadows
- [ ] All blue colors changed to #38B6FF
- [ ] Banner shows on Welcome/SignIn/SignUp screens
- [ ] Logo shows in Feed header
- [ ] Tab bar icons are Heroicons
- [ ] Focused tab icons are solid
- [ ] Unfocused tab icons are outline
- [ ] Active tab color is #38B6FF
- [ ] Everything looks polished

---

## 🎨 **Color Reference**

**Old:** #3B82F6 (blue-500)  
**New:** #38B6FF (bright cyan blue)

**Usage:**
- Primary buttons
- Links
- Active tab bar
- Accents
- Focus states

---

## 🐛 **Common Issues**

**Issue:** Banner/logo not showing  
**Fix:** Check file path, ensure assets folder exists

**Issue:** Heroicons not working  
**Fix:** Make sure react-native-svg is installed

**Issue:** Colors not updating  
**Fix:** Clear metro bundler cache: `npx expo start -c`

**Issue:** Shadows not showing on Android  
**Fix:** Use `elevation` property instead of `shadowColor`

---

**All UI updates ready for implementation!** 🎨✨
