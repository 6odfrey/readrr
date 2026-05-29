// Google Books API service

export interface BookInfo {
  isbn: string | null;
  title: string;
  author: string;
  cover_image_url: string | null;
  publisher?: string;
  publishedDate?: string;
  description?: string;
}

// Extract book ID from Google Books URL
function extractBookId(url: string): string | null {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}

// Build Google Books cover URL (fallback - lower quality but always available)
function buildGoogleBooksUrl(bookId: string): string {
  return `https://books.google.com/books/content?id=${bookId}&printsec=frontcover&img=1&zoom=1`;
}

// Build Open Library cover URL (preferred - higher quality)
function buildOpenLibraryUrl(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

// Helper function to get best quality cover image
// Prefers Open Library (higher quality) with Google Books as fallback
function getCoverImageUrl(imageLinks: any, isbn: string | null): string | null {
  // If we have ISBN, prefer Open Library (better quality)
  if (isbn) {
    return buildOpenLibraryUrl(isbn);
  }

  // Fallback to Google Books if no ISBN
  if (!imageLinks) {
    return null;
  }

  const url =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.small ||
    imageLinks.thumbnail;

  if (!url) {
    return null;
  }

  const bookId = extractBookId(url);
  if (bookId) {
    return buildGoogleBooksUrl(bookId);
  }

  return null;
}

export async function fetchBookByISBN(isbn: string): Promise<BookInfo> {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
  );
  const json = await response.json();

  console.log('📚 Google Books API response:', JSON.stringify(json, null, 2));

  if (json.items && json.items.length > 0) {
    const item = json.items[0];
    const book = item.volumeInfo;
    const bookId = item.id;

    // Get cover URL - prefers Open Library if ISBN available
    const coverUrl = getCoverImageUrl(book.imageLinks, isbn);

    console.log('📸 Cover URL:', coverUrl);

    return {
      isbn,
      title: book.title || 'Unknown Title',
      author: book.authors?.join(', ') || 'Unknown Author',
      cover_image_url: coverUrl,
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      description: book.description,
    };
  }

  throw new Error('Book not found');
}

export async function searchBooks(query: string): Promise<BookInfo[]> {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
  );
  const json = await response.json();

  if (json.items && json.items.length > 0) {
    return json.items.map((item: any) => {
      const book = item.volumeInfo;
      const isbn = book.industryIdentifiers?.find(
        (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier || null;

      return {
        isbn,
        title: book.title || 'Unknown Title',
        author: book.authors?.join(', ') || 'Unknown Author',
        cover_image_url: getCoverImageUrl(book.imageLinks, isbn),
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        description: book.description,
      };
    });
  }

  return [];
}
