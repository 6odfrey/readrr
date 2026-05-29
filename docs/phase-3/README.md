# Phase 3: Swap Execution

**Duration:** 2-3 weeks  
**Goal:** Enable users to request swaps, chat, and complete exchanges

---

## 📋 Overview

Phase 3 brings the core swap functionality to life:
- Request to swap a book
- Inbox to manage swap requests
- Real-time chat between swap partners
- Mark swaps as complete
- Update swap statistics

By the end of Phase 3, users can:
- ✅ Request a swap from book detail page
- ✅ See pending requests in their inbox
- ✅ Accept or decline swap requests
- ✅ Chat in real-time with swap partner
- ✅ Mark swap as complete (meetup happened)
- ✅ See their swap count increase

---

## 🎯 Exit Criteria

Phase 3 is complete when:

1. ✅ Swaps table created with proper schema
2. ✅ Messages table created for chat
3. ✅ Can request swap from book detail page
4. ✅ Inbox shows pending/accepted/declined requests
5. ✅ Can accept/decline swap requests
6. ✅ Chat screen works with real-time messages
7. ✅ Can mark swap as complete
8. ✅ Swap counts update in users table
9. ✅ Post availability changes to "swapped"
10. ✅ Push notifications for new requests/messages (basic)
11. ✅ All tests passing (see TESTING.md)

---

## 📂 Sections

### **3.1 Database Schema** (2-3 hours)
**File:** `SWAPS_SCHEMA.md`

- Create swaps table
- Create messages table
- Set up RLS policies
- Add indexes for performance

**Exit:** Tables created, can query from Supabase

---

### **3.2 Request Swap Flow** (6-8 hours)
**File:** `REQUEST_FLOW.md`

- Add "Request Swap" button to book detail
- Create swap request modal
- Handle request creation
- Update post availability
- Notify book owner

**Exit:** Users can request swaps, owner gets notified

---

### **3.3 Inbox Screen** (8-10 hours)
**File:** `INBOX.md`

- Build inbox with tabs (Received / Sent)
- Show pending requests
- Accept/Decline buttons
- Show accepted chats
- Real-time updates for new requests

**Exit:** Inbox displays all swap requests, can accept/decline

---

### **3.4 Real-time Chat** (10-12 hours)
**File:** `CHAT.md`

- Build chat screen
- Real-time messaging with Supabase
- Message bubbles (sent/received)
- Timestamp formatting
- Typing indicators (optional)
- "Mark Complete" button

**Exit:** Users can chat in real-time, messages appear instantly

---

### **3.5 Complete Swap** (4-5 hours)
**File:** `MARK_COMPLETE.md`

- "Mark as Complete" button in chat
- Both users must confirm
- Update swap status
- Increment total_swaps count
- Update post availability to "swapped"
- Trigger rating prompt (Phase 4)

**Exit:** Swaps can be marked complete, stats update

---

### **3.6 Testing** (4-6 hours)
**File:** `TESTING.md`

- Test request flow
- Test accept/decline
- Test real-time chat
- Test complete swap
- Test edge cases
- Fix any bugs

**Exit:** All features working smoothly on multiple devices

---

## 📊 Time Breakdown

| Section | Time | Complexity |
|---------|------|------------|
| 3.1 Database | 2-3h | Easy |
| 3.2 Request Flow | 6-8h | Medium |
| 3.3 Inbox | 8-10h | Medium |
| 3.4 Chat | 10-12h | Hard |
| 3.5 Complete | 4-5h | Medium |
| 3.6 Testing | 4-6h | Medium |
| **Total** | **34-44 hours** | **2-3 weeks** |

---

## 🗂️ File Structure After Phase 3

```
src/
├── screens/
│   ├── main/
│   │   ├── InboxScreen.tsx              # NEW - Swap requests
│   │   └── ChatScreen.tsx               # NEW - Real-time chat
│   │
│   └── ... (existing screens)
│
├── components/
│   ├── SwapRequestCard.tsx              # NEW - Request display
│   ├── ChatBubble.tsx                   # NEW - Message bubble
│   └── ... (existing components)
│
├── services/
│   ├── swapsService.ts                  # NEW - Swap CRUD
│   ├── messagesService.ts               # NEW - Chat functions
│   └── ... (existing services)
│
└── store/
    ├── swapsStore.ts                    # NEW - Swap state (optional)
    └── ... (existing stores)
```

---

## 🔑 Key Decisions

### **Why Swaps Table Instead of "Requests"?**
- Swaps encompass the entire lifecycle (requested → accepted → completed)
- One record tracks the whole process
- Easier to query and update status

### **Why Separate Messages Table?**
- Chat is distinct from swap request
- Needs real-time subscriptions
- Could be reused for other features later

### **Why Both Users Must Confirm Complete?**
- Prevents abuse (one person marking complete alone)
- Ensures meetup actually happened
- Both agree before stats update

### **Why Real-time for Chat?**
- Expected behavior (users expect instant messaging)
- Better UX than polling
- Supabase Realtime makes it easy

---

## 🚨 Common Pitfalls

### **1. Swap Request Spam**
**Problem:** User requests same book multiple times  
**Solution:** Check for existing pending request before allowing new one

### **2. Chat Performance**
**Problem:** Loading all messages at once is slow  
**Solution:** Load last 50 messages, pagination for older ones

### **3. Race Conditions**
**Problem:** Two users accept same swap simultaneously  
**Solution:** Use database transactions, check status before update

### **4. Orphaned Chats**
**Problem:** Chat exists but swap was declined  
**Solution:** Archive/hide declined swaps, only show accepted

### **5. Notification Overload**
**Problem:** Too many push notifications  
**Solution:** Batch notifications, allow user preferences

---

## 📝 Prerequisites

Before starting Phase 3:

- ✅ Phase 2 complete (posts, feed, engagement working)
- ✅ Users can view book details
- ✅ Supabase Realtime enabled
- ✅ expo-notifications installed (or ready to install)

---

## 🎯 Next Steps

1. Read `SWAPS_SCHEMA.md`
2. Run database migrations
3. Follow sections 3.2 through 3.5
4. Update `STATUS.md` as you complete each section
5. When Phase 3 is 100% complete, fill out `../checkpoints/CHECKPOINT_PHASE_3.md`
6. Proceed to Phase 4 (Ratings & Revenue)!

---

## 💡 Tips

- **Test with 2 devices** - Real-time chat needs multiple users
- **Use test accounts** - Create 2-3 accounts for testing
- **Check Supabase logs** - Real-time can be tricky, logs help debug
- **Handle offline mode** - What happens if user loses connection?
- **Think about edge cases** - What if user deletes post mid-swap?

---

## 🎨 User Flow Example

**Alice wants to swap "Harry Potter":**

1. **Alice:** Views Bob's swap post for "Harry Potter"
2. **Alice:** Taps "Request Swap" button
3. **Alice:** Confirms request with optional message
4. **Bob:** Gets notification "Alice wants to swap!"
5. **Bob:** Opens inbox, sees Alice's request
6. **Bob:** Taps "Accept" (or "Decline")
7. **Both:** Chat opens automatically
8. **Alice & Bob:** Message back and forth to arrange meetup
9. **Alice & Bob:** Meet up, exchange books
10. **Bob:** In chat, taps "Mark as Complete"
11. **Alice:** Confirms "Yes, swap complete"
12. **System:** Updates stats, marks post as swapped
13. **Both:** Prompted to rate each other (Phase 4)

---

**Ready to enable real swaps!** 🔄📚
