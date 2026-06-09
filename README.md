# Readrr

A book-swapping social app built with React Native, Expo, and Supabase. Discover books, connect with readers nearby, and swap books in safe public places.

---

## Features

### Social Feed
- Dual-tab feed — social posts (what people are reading) and swap listings
- Like and comment on posts
- Pull-to-refresh and infinite scroll

### Book Swaps
- List a book for swap with condition, genre, and swap type (trade / borrow / gift)
- Scan a book's barcode to auto-fill details via Google Books API + Open Library fallback
- Request a swap with an optional message
- Accept or decline incoming requests from your Inbox
- Real-time chat to coordinate the exchange
- Dual-confirmation completion flow — both parties confirm before the swap closes

### Meetup Coordination
- Suggest a safe public meeting place directly in the chat
- Category chips — Coffee Shop, Library, Bookshop, Bar, Book Club, Community Space
- Finds real nearby venues using the Overpass (OpenStreetMap) API based on your location
- Mutual confirmation — the other party can accept or counter-suggest
- Agreed meetup stays pinned above the chat for both users

### Search
- Search readers by username
- Search books by title or author via Google Books API
- Search posts by book title or author

### Profiles & Social
- Follow / unfollow other readers
- Follower and following counts
- Star ratings after each completed swap (1–5 stars with optional comment)
- Average rating displayed on profiles and search results
- Long-press a post to delete it or mark it as no longer available

### Notifications
- In-app notification centre with unread badge on the bell icon
- Notified on: swap accepted, new message, meetup proposed, meetup confirmed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Styling | NativeWind (Tailwind CSS) |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| State | Zustand |
| Navigation | React Navigation v7 |
| Book data | Google Books API + Open Library API |
| Places | Overpass API (OpenStreetMap) |
| Push notifications | Expo Notifications |

---

## Getting Started

### Prerequisites
- Node.js 18+
- [Expo Go](https://expo.dev/go) installed on your phone
- A free [Supabase](https://supabase.com) account

### 1. Clone and install

```bash
git clone https://github.com/6odfrey/readrr.git
cd readrr
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in with GitHub
2. Click **New project**, name it `readrr`
3. Once created, go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 3. Create your `.env` file

In the root of the project create a file named `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

This file is gitignored — never commit it.

### 4. Run the database migrations

1. In your Supabase project, open **SQL Editor → New query**
2. Open `supabase/combined_setup.sql` in VS Code, select all, copy
3. Paste into the SQL Editor and click **Run**

That creates all tables, storage buckets, RLS policies, and triggers in one go.

### 5. Disable email confirmation (recommended for development)

In Supabase go to **Authentication → Providers → Email** and toggle off **Confirm email**. This lets you sign up and go straight into the app without needing to click a confirmation link.

### 6. Start the app

```bash
npx expo start --clear
```

Scan the QR code with Expo Go on your phone.

---

## Project Structure

```
src/
├── components/       # Shared UI components
├── config/           # Supabase client
├── models/           # TypeScript interfaces
├── navigation/       # React Navigation setup
├── screens/
│   ├── auth/         # Sign in, sign up, welcome
│   ├── main/         # Feed, search, inbox, chat, notifications
│   ├── onboarding/   # Profile setup, first post
│   └── profile/      # Own profile, other user profile, edit
├── services/         # API and Supabase service functions
└── store/            # Zustand auth store
supabase/
├── combined_setup.sql   # Single-file DB setup (run this)
└── migrations/          # Individual migration files (for reference)
```

---

## Branch workflow

We work on feature branches, never directly on `main`.

```bash
# Start new work
git checkout main
git pull origin main
git checkout -b your-name/feature-name

# Push when ready
git push origin your-name/feature-name
# Then open a Pull Request on GitHub
```

---

## Roadmap

- [ ] Nearby books feed (location-based)
- [ ] Following-based feed filter
- [ ] Report / block user
- [ ] Stripe subscription tier
