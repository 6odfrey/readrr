# Phase 2: Google Books API - Cover Images Fix

**Issue:** Posts show book title/author but not cover images  
**Solution:** Update Google Books service to properly fetch and store cover URLs

---

## 📋 Problem

When scanning a barcode or searching for books:
- ✅ Book title fetched correctly
- ✅ Author fetched correctly
- ❌ Cover image NOT being fetched/displayed properly

---

## 🔧 Solution: Update Books Service

**File:** `src/services/booksService.ts`

```typescript
import axios from 'axios';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY || ''; // Optional but recommended

export interface BookData {
  isbn: string;
  title: string;
  author: string;
  cover_url: string; // This is what we need!
  publisher?: string;
  publishedDate?: string;
  description?: string;
}

export async function fetchBookByISBN(isbn: string): Promise<BookData> {
  try {
    const url = API_KEY 
      ? `${GOOGLE_BOOKS_API}?q=isbn:${isbn}&key=${API_KEY}`
      : `${GOOGLE_BOOKS_API}?q=isbn:${isbn}`;
    
    const response = await axios.get(url);
    
    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Book not found');
    }
    
    const book = response.data.items[0].volumeInfo;
    
    // IMPORTANT: Get the highest quality cover image
    const coverUrl = getCoverImageUrl(book.imageLinks);
    
    return {
      isbn,
      title: book.title || 'Unknown Title',
      author: book.authors?.[0] || 'Unknown Author',
      cover_url: coverUrl, // ← This is the fix!
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      description: book.description,
    };
  } catch (error) {
    console.error('Error fetching book:', error);
    throw new Error('Could not fetch book information');
  }
}

// Helper function to get best quality cover image
function getCoverImageUrl(imageLinks: any): string {
  if (!imageLinks) {
    return ''; // No image available
  }
  
  // Google Books provides multiple sizes, get the best quality:
  // Priority: extraLarge > large > medium > small > thumbnail
  return (
    imageLinks.extraLarge?.replace('http:', 'https:') ||
    imageLinks.large?.replace('http:', 'https:') ||
    imageLinks.medium?.replace('http:', 'https:') ||
    imageLinks.small?.replace('http:', 'https:') ||
    imageLinks.thumbnail?.replace('http:', 'https:') ||
    ''
  );
}

// Also support searching by title (for manual entry)
export async function searchBooks(query: string): Promise<BookData[]> {
  try {
    const url = API_KEY
      ? `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=10`
      : `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=10`;
    
    const response = await axios.get(url);
    
    if (!response.data.items) {
      return [];
    }
    
    return response.data.items.map((item: any) => {
      const book = item.volumeInfo;
      const isbn = book.industryIdentifiers?.[0]?.identifier || '';
      
      return {
        isbn,
        title: book.title || 'Unknown Title',
        author: book.authors?.[0] || 'Unknown Author',
        cover_url: getCoverImageUrl(book.imageLinks),
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        description: book.description,
      };
    });
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
}
```

---

## 🎨 Updated PostCard Component

Make sure PostCard properly displays the cover image:

**File:** `src/components/PostCard.tsx`

```typescript
// ... existing imports ...

export default function PostCard({ post }: Props) {
  // ... existing state and logic ...

  return (
    <View className="bg-white mb-4 pb-4">
      {/* Header - User info */}
      <View className="flex-row items-center px-4 py-3">
        <Avatar avatarUrl={post.user.avatar_url} username={post.user.username} size={40} />
        <View className="ml-3 flex-1">
          <Text className="font-semibold">@{post.user.username}</Text>
          <Text className="text-gray-500 text-xs">
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Main Image - This is the key part! */}
      {post.post_type === 'swap' && post.image_url ? (
        // Swap posts: Show user's uploaded photo
        <Image
          source={{ uri: post.image_url }}
          style={{ width: '100%', height: 400 }}
          contentFit="cover"
          className="mb-3"
        />
      ) : post.cover_url ? (
        // Social posts OR swaps without photo: Show book cover from Google Books
        <View className="px-4 mb-3">
          <Image
            source={{ uri: post.cover_url }}
            style={{ width: '100%', height: 300 }}
            contentFit="contain"
            className="rounded-lg"
          />
        </View>
      ) : null}

      {/* Book Info */}
      <View className="px-4 mb-2">
        <Text className="font-bold text-lg">{post.title}</Text>
        {post.author && (
          <Text className="text-gray-600 text-sm">by {post.author}</Text>
        )}
        
        {/* Swap-specific info */}
        {post.post_type === 'swap' && (
          <View className="flex-row mt-2">
            {post.condition && (
              <View className="bg-gray-100 px-3 py-1 rounded-full mr-2">
                <Text className="text-xs text-gray-700">
                  {post.condition.replace('_', ' ')}
                </Text>
              </View>
            )}
            {post.genre && (
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-xs text-blue-700">{post.genre}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Engagement Buttons */}
      <View className="flex-row items-center px-4 mt-3">
        {/* Like Button */}
        <TouchableOpacity
          onPress={handleLike}
          disabled={loading}
          className="flex-row items-center mr-6"
        >
          <Text className="text-2xl mr-2">
            {hasLiked ? '❤️' : '🤍'}
          </Text>
          <Text className="text-gray-700 font-semibold">
            {likeCount}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={handleComment}
          className="flex-row items-center"
        >
          <Text className="text-2xl mr-2">💬</Text>
          <Text className="text-gray-700 font-semibold">
            {commentCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 🎨 Display Logic

**Social Posts:**
- Show book cover from Google Books API
- Show title + author below
- No user-uploaded photo

**Swap Posts:**
- Show user's uploaded photo of actual book (if provided)
- OR show book cover from Google Books (fallback)
- Show title + author
- Show condition + genre tags

---

## ✅ Checklist to Fix

1. **Update booksService.ts:**
   - [x] Add `getCoverImageUrl()` helper function
   - [x] Ensure `fetchBookByISBN()` returns `cover_url`
   - [x] Replace http:// with https:// for covers
   - [x] Prioritize high-quality images (extraLarge > large > medium)

2. **Update PostCard.tsx:**
   - [x] Display `cover_url` for social posts
   - [x] Display `image_url` for swap posts (user photo)
   - [x] Fallback to `cover_url` if swap post has no user photo
   - [x] Set proper image height (300-400px)
   - [x] Use `contentFit="contain"` for covers, `"cover"` for user photos

3. **Verify Database:**
   - [x] Posts table has `cover_url` column (should already exist)
   - [x] Posts table has `image_url` column for swap posts
   - [x] Check existing posts have cover_url populated

---

## 🐛 Testing

**Test with real ISBNs:**
```typescript
// Test popular books with good covers:
fetchBookByISBN('9780439139595'); // Harry Potter
fetchBookByISBN('9780061120084'); // To Kill a Mockingbird
fetchBookByISBN('9780544003415'); // The Hobbit
```

**Expected result:**
- Cover image URL returned
- Image displays in PostCard
- High-quality image (not tiny thumbnail)

---

## 📸 Example Response from Google Books

```json
{
  "volumeInfo": {
    "title": "Harry Potter and the Sorcerer's Stone",
    "authors": ["J.K. Rowling"],
    "imageLinks": {
      "smallThumbnail": "http://books.google.com/books/content?id=...&zoom=5",
      "thumbnail": "http://books.google.com/books/content?id=...&zoom=1",
      "small": "http://books.google.com/books/content?id=...&zoom=2",
      "medium": "http://books.google.com/books/content?id=...&zoom=3",
      "large": "http://books.google.com/books/content?id=...&zoom=4",
      "extraLarge": "http://books.google.com/books/content?id=...&zoom=6"
    }
  }
}
```

**We want `extraLarge` or `large` for best quality!**

---

## 🎯 Visual Layout Reference

Based on your mockup, the feed should look like:

```
┌────────────────────────────────┐
│ [@username]  [avatar]          │ ← Header
├────────────────────────────────┤
│                                │
│      [BOOK COVER IMAGE]        │ ← Large, centered
│         (prominent)            │
│                                │
├────────────────────────────────┤
│ "Harry Potter and the..."      │ ← Title (bold)
│ by J.K. Rowling               │ ← Author (gray)
├────────────────────────────────┤
│ ❤️ 24    💬 8                  │ ← Engagement
└────────────────────────────────┘
```

---

## ❓ Common Issues

**Issue:** Cover images not showing  
**Fix:** Check `cover_url` in database, verify Google Books API returning imageLinks

**Issue:** Images are tiny/blurry  
**Fix:** Use `getCoverImageUrl()` to prioritize larger sizes

**Issue:** "http" images blocked  
**Fix:** Replace `http:` with `https:` in URLs

**Issue:** Some books have no cover  
**Fix:** Show placeholder image or just title/author

---

## 🚀 Quick Fix Commands

```bash
# 1. Update booksService.ts with the code above
# 2. Update PostCard.tsx to show cover_url
# 3. Test with a real barcode scan
# 4. Verify cover image appears in feed
```

---

**This should fix the cover images! Let me know if you need any adjustments!** 📚✨
