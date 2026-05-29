# Readrr - Book Swapping App

## Tech Stack
- React Native with Expo
- Supabase (auth, database, storage, realtime)
- NativeWind (TailwindCSS)
- 2-column grid layout (bookshelf-inspired design)

## Current Status
**Phase 3: Swap Execution** - 90% Complete
See [/docs/phase-3/STATUS.md] for detailed task tracking

### What's Working
- User auth (sign up, sign in, profile setup)
- Social posts (share what you're reading)
- Swap posts (list books for swap with photos)
- Dual-tab feed (Feed / Swaps)
- Book detail pages
- Request swap flow with modal
- Inbox with Received/Sent tabs + badge notifications
- Real-time chat between swap partners
- Mark swap complete (both users must confirm)
- Profile with Posts/Listed/Completed stats

### Remaining Tasks
1. **Push Notifications** - Need expo-notifications setup for:
   - New swap request received
   - Swap request accepted/declined
   - New chat message received

## Architecture Summary
- **Bottom tabs:** Feed, Swaps, Inbox, Profile
- **Swap flow:** Request → Accept → Chat → Both Mark Complete → Done
- **Realtime:** Supabase subscriptions for chat messages, inbox updates, badge counts

## Key Files
- `src/navigation/RootNavigator.tsx` - All navigation + inbox badge logic
- `src/screens/main/ChatScreen.tsx` - Real-time chat with completion flow
- `src/screens/main/InboxScreen.tsx` - Swap requests management
- `src/screens/main/BookDetailScreen.tsx` - Request swap button
- `src/services/swapsService.ts` - Swap CRUD operations
- `src/services/messagesService.ts` - Chat message operations

## Database Tables
- `users` - Profiles with total_swaps count
- `posts` - Social & swap posts with availability status
- `swaps` - Swap requests (pending/accepted/completed)
- `messages` - Chat messages between swap partners
- `likes`, `comments` - Social engagement

## Recent Bug Fixes (Feb 4, 2026)
- Fixed real-time chat (was not showing new messages)
- Added inbox badge for pending requests + unread messages
- Added "Completed" swap count to profile
- Require message exchange before marking complete
- Chat disabled after one person marks complete
- Completed swaps show celebration screen then vanish

## Next Session
1. **Enable Supabase Realtime** (if not done):
   - Dashboard → Database → Replication → Enable for `messages` and `swaps`
   - Or SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE messages, swaps;`
2. Set up expo-notifications for push notifications
3. Test full swap flow with 2 devices
4. Move to Phase 4 (Ratings, Payments)

## Development Notes
- Use `npx expo start` to run
- Two test accounts needed for swap testing
- Supabase Realtime must be enabled for chat
