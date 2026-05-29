# Phase 3 Complete Package - Summary

**Status:** ✅ Ready for Development  
**Created:** January 25, 2026

---

## 📦 What You Have (Phase 3 Docs)

### **✅ Created Files:**

1. **README.md** - Phase 3 overview, timeline, exit criteria
2. **STATUS.md** - Progress tracker
3. **SWAPS_SCHEMA.md** - Complete SQL for swaps + messages tables
4. **PHASE_3_SUMMARY.md** (this file)

---

## 🎯 What You'll Build in Phase 3

### **Database:**
- ✅ swaps table (request → accepted → completed)
- ✅ messages table (real-time chat)
- ✅ Helper functions (unread counts, mark read, etc.)

### **Screens:**
- ✅ InboxScreen (pending/accepted swaps with tabs)
- ✅ ChatScreen (real-time messaging)
- ✅ Request swap modal/button (on book detail)

### **Features:**
- ✅ Request swap from book detail
- ✅ Accept/decline swap requests
- ✅ Real-time chat between swap partners
- ✅ Mark swap as complete (both must confirm)
- ✅ Update swap counts
- ✅ Basic push notifications

---

## ⏱️ Timeline

**Total:** 2-3 weeks (34-44 hours)

**Week 1:**
- Database schema (1 day)
- Request swap flow (2 days)
- Start inbox (1 day)

**Week 2:**
- Complete inbox (2-3 days)
- Build real-time chat (3-4 days)

**Week 3:**
- Mark complete flow (1 day)
- Testing & polish (2-3 days)

---

## 🚀 Getting Started

### **Step 1: Database (30 min)**
```bash
# Open Supabase SQL Editor
# Copy ALL SQL from SWAPS_SCHEMA.md
# Run migrations
# Verify tables created
```

### **Step 2: Understand the Flow**

**User Story:**
```
1. Alice views Bob's swap post "Harry Potter"
2. Alice taps "Request Swap" button
3. Modal opens: "Want to swap? Add optional message"
4. Alice sends request
5. Bob gets notification → opens Inbox
6. Bob sees Alice's request → taps "Accept"
7. Chat opens automatically for both
8. They message to arrange meetup
9. After meetup, Bob taps "Mark as Complete"
10. Alice confirms "Yes, complete"
11. Both users' total_swaps increments
12. Post marked as "swapped"
```

---

## 📋 What Claude Code Needs to Build

### **1. Request Swap Button (on BookDetailScreen)**

Add to book detail page:
```typescript
// Only show if:
// - Post is available (not swapped)
// - User is not the owner
// - No existing pending request

<TouchableOpacity onPress={handleRequestSwap}>
  <Text>Request Swap</Text>
</TouchableOpacity>
```

**Flow:**
1. Check if can request (helper function)
2. Show modal/confirmation
3. Optional message input
4. Create swap in database
5. Show success → navigate to inbox
6. Notify owner

---

### **2. InboxScreen**

**Two tabs:**
- **Received:** Requests others sent to you
- **Sent:** Requests you sent to others

**Features:**
- Show pending requests with Accept/Decline
- Show accepted chats (tap to open)
- Show requester/owner info
- Show book title/cover
- Show unread message count
- Real-time updates for new requests

**Layout:**
```
┌─────────────────────────┐
│  Received │ Sent        │  ← Tabs
├─────────────────────────┤
│  ┌──────────────────┐   │
│  │ @alice  👤       │   │
│  │ [Book cover]     │   │
│  │ "Harry Potter"   │   │
│  │ "Can we meet?"   │   │
│  │ [Accept][Decline]│   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ @bob    👤   💬3 │   │  ← Unread count
│  │ "Lord of Rings"  │   │
│  │ Tap to chat      │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

---

### **3. ChatScreen**

**Features:**
- Real-time messaging (Supabase Realtime)
- Message bubbles (sent on right, received on left)
- User avatar + name at top
- Text input at bottom
- "Mark as Complete" button (if swap accepted)
- Auto-scroll to latest message
- Mark messages as read

**Layout:**
```
┌─────────────────────────┐
│  ← @alice  👤  [...]    │  ← Header
├─────────────────────────┤
│                         │
│  ┌─────────────┐        │  ← Received (left)
│  │ Hi! Can we  │        │
│  │ meet tomorrow? │     │
│  │ 2:30 PM        │     │
│  └─────────────┘        │
│                         │
│        ┌─────────────┐  │  ← Sent (right)
│        │ Sure! Where? │  │
│        │ 2:31 PM      │  │
│        └─────────────┘  │
│                         │
│ [Mark Complete]         │  ← Button
├─────────────────────────┤
│ [Type message...] [Send]│  ← Input
└─────────────────────────┘
```

---

### **4. Mark Complete Flow**

**In ChatScreen:**
```typescript
// Button only shows if status = 'accepted'
// When tapped:
1. Update requester_confirmed_complete OR owner_confirmed_complete
2. Check if BOTH confirmed
3. If both confirmed:
   - Update swap status to 'completed'
   - Increment both users' total_swaps
   - Update post availability to 'swapped'
   - Show success message
   - Trigger rating prompt (Phase 4)
4. If only one confirmed:
   - Show "Waiting for other user to confirm"
```

---

## 🤖 Prompts for Claude Code

### **For Inbox Screen:**
```
Claude Code, create InboxScreen with two tabs (Received/Sent):

RECEIVED TAB:
- Show swap requests others sent to me
- For pending: Show Accept/Decline buttons
- For accepted: Show as chat (tap to open)
- Show requester avatar, book cover, optional message
- Real-time updates when new request arrives

SENT TAB:
- Show swap requests I sent to others
- Show status (pending/accepted/declined)
- Show owner avatar, book cover
- If accepted, show as chat (tap to open)

Use FlatList for each tab
Subscribe to Supabase Realtime for new swaps
Reference: phase-3/SWAPS_SCHEMA.md for database structure
```

### **For Chat Screen:**
```
Claude Code, create ChatScreen for real-time chat between swap partners:

FEATURES:
- Header with other user's avatar + username
- Messages in bubbles (mine on right in blue, theirs on left in gray)
- Real-time updates using Supabase Realtime
- Text input at bottom with Send button
- Auto-scroll to latest message
- Mark messages as read when viewing
- "Mark as Complete" button if swap is accepted

Use Supabase channel subscription for real-time
Load last 50 messages on open
Reference: phase-3/SWAPS_SCHEMA.md for messages table structure
```

### **For Request Swap:**
```
Claude Code, add "Request Swap" functionality to BookDetailScreen:

BUTTON:
- Only show if post.availability = 'available'
- Only show if current user is NOT the owner
- Check for existing pending request (don't show if already requested)

FLOW:
1. Tap button → Show modal/alert
2. Optional message input (max 500 chars)
3. Create swap in database with status='pending'
4. Show success message
5. Navigate to InboxScreen → Sent tab
6. (Optional) Send push notification to owner

Use helper function can_request_swap() to check eligibility
Reference: phase-3/SWAPS_SCHEMA.md
```

---

## 📊 Database Tables Quick Reference

### **swaps:**
```typescript
{
  id: UUID
  requester_id: UUID  // Who wants the book
  owner_id: UUID      // Who owns the book
  post_id: UUID       // Which book
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
  request_message: string (optional)
  requester_confirmed_complete: boolean
  owner_confirmed_complete: boolean
  created_at: timestamp
}
```

### **messages:**
```typescript
{
  id: UUID
  swap_id: UUID       // Which swap this belongs to
  sender_id: UUID     // Who sent it
  content: string     // Message text (max 1000 chars)
  is_read: boolean
  created_at: timestamp
}
```

---

## ✅ Phase 3 Checklist

**Database:**
- [ ] swaps table created
- [ ] messages table created
- [ ] RLS policies working
- [ ] Helper functions created

**Request Swap:**
- [ ] Button shows on book detail
- [ ] Can create swap request
- [ ] Owner gets notified
- [ ] Request appears in inbox

**Inbox:**
- [ ] Received tab shows requests to me
- [ ] Sent tab shows requests I made
- [ ] Can accept/decline requests
- [ ] Can tap to open chat
- [ ] Real-time updates for new requests

**Chat:**
- [ ] Real-time messaging works
- [ ] Messages appear instantly
- [ ] Message bubbles styled correctly
- [ ] Can send messages
- [ ] Mark as Complete button works

**Complete Swap:**
- [ ] Both users can confirm
- [ ] Status updates to completed
- [ ] total_swaps increments
- [ ] Post availability changes to swapped

---

## 🐛 Common Issues

**Issue:** Real-time not working in chat  
**Fix:** Check Supabase Realtime enabled, verify channel subscription

**Issue:** Can't send messages  
**Fix:** Check swap status is 'accepted', verify RLS policies

**Issue:** Duplicate requests  
**Fix:** Use unique constraint, check before creating

**Issue:** Both users can't mark complete  
**Fix:** Use separate boolean fields, check both before marking completed

---

## 🎯 Success Criteria

Phase 3 is complete when:
- ✅ Can request swaps
- ✅ Can accept/decline requests
- ✅ Real-time chat works on 2 devices
- ✅ Can mark swaps complete
- ✅ Stats update correctly
- ✅ No critical bugs

---

## 🚀 What's Next?

**When Phase 3 is done:**
1. Update STATUS.md - all sections ✅
2. Test with 2 devices/accounts
3. Come back and say: **"Phase 3 complete, create Phase 4 docs"**
4. I'll create Phase 4 (Ratings, Payments, Notifications)

---

**Phase 3 makes Readrr a REAL swap platform!** 🔄📚✨
