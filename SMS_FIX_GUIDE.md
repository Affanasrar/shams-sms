# SMS Messaging Display Issue - Diagnosis & Fix

## Problem Summary
SMS messages are showing in TextBee's external dashboard (https://textbee-rho.vercel.app/dashboard/messaging) but **NOT appearing in the application's messaging interface**.

---

## Root Cause Analysis

### The Issue
The webhook handler (`app/api/webhooks/textbee/route.ts`) was creating **inbound SMS records with `studentId: null`**. This causes two problems:

1. **No Student Relationship**: The SMS record exists in the database but isn't linked to any Student
2. **Inbox Query Fails**: The main inbox query uses `WHERE smsMessages: { some: {} }` to find students with conversations
   - Without a Student relationship (studentId), inbound SMS don't match any student
   - Result: SMS exist in DB but don't display in the UI

### Data Flow Problem
```
TextBee Webhook → SMS Created (studentId: null) → Not linked to Student
                                                  ↓
                          Can't appear in inbox (needs Student relationship)
                                                  ↓
                    Shows in TextBee (uses phone index) but NOT in app
```

---

## Solution Applied

### 1. ✅ Updated Webhook Handler
**File**: `app/api/webhooks/textbee/route.ts`

**Changes Made**:
- Added import: `import { normalizePhoneNumber } from '@/lib/textbee'`
- Modified `handleMessageReceived()` function to:
  - Normalize the incoming phone number to match database format
  - Query student by phone number
  - Set `studentId` when creating the SMS record
  - Log whether student was found for debugging

**Result**: New inbound SMS will automatically link to their students

### 2. ✅ Exported Phone Function
**File**: `lib/textbee.ts`

**Changes Made**:
- Added `export` keyword to `normalizePhoneNumber()` function
- Now available for import in webhook handler

**Phone Normalization Logic** (handles multiple formats):
```
+923331234567        → +923331234567 (keeps as-is)
03331234567          → +923331234567 (Pakistan format)
00923331234567       → +923331234567 (international prefix)
3331234567           → +923331234567 (bare digits, assumes Pakistan)
```

### 3. ✅ Created Backfill Script
**File**: `scripts/fix-orphaned-sms.js`

**Purpose**: Fix existing inbound SMS records that have `studentId: null`

**What it does**:
- Finds all inbound SMS with null studentId
- Normalizes each phone number
- Looks up the corresponding student
- Updates the SMS with the correct studentId
- Logs results (fixed count, not found count)

---

## How to Apply the Fix

### Step 1: Deploy Code Changes
Deploy the following files to your production environment:
1. `app/api/webhooks/textbee/route.ts` — Updated webhook handler
2. `lib/textbee.ts` — Exported normalizePhoneNumber function

### Step 2: Run Backfill Script (One-Time)
Fix all existing orphaned SMS messages:
```bash
node scripts/fix-orphaned-sms.js
```

**Output will show**:
- ✅ Fixed: Number of SMS linked to students
- ❌ Not found: Number of SMS from unknown phone numbers

### Step 3: Verify Fix
- Navigate to the SMS/Messaging section
- You should now see conversations for all students with SMS history
- New inbound SMS will automatically appear

---

## Affected Code Files

### Modified Files:
- ✅ `app/api/webhooks/textbee/route.ts` — Webhook handler (fixed)
- ✅ `lib/textbee.ts` — Exported function (fixed)

### New Files:
- ✅ `scripts/fix-orphaned-sms.js` — Backfill script

### Related (Not Modified):
- `app/api/admin/sms/inbox/route.ts` — Inbox API (working correctly)
- `app/admin/sms/page.tsx` — UI component (working correctly)
- `prisma/schema.prisma` — Database schema (no changes needed)

---

## Verification Checklist

After applying the fix:

- [ ] Code deployed to production
- [ ] Backfill script ran successfully
- [ ] SMS logs show fixed count > 0 (means orphaned SMS were linked)
- [ ] SMS/Messaging section displays conversations
- [ ] Can select a student to view SMS history
- [ ] New inbound SMS appear in real-time
- [ ] Logs view shows all SMS (inbound + outbound)

---

## Troubleshooting

### Still Not Seeing SMS?

1. **Check logs**: 
   - Run backfill script with output logging
   - Look for "No student found" messages
   - Phone numbers may not match student records

2. **Verify phone numbers**:
   - Check `Student.phone` field in database
   - Ensure phone format matches (should be +92XXXXXXXXXX for Pakistan)
   - SMS phone format should match student phone format

3. **Check database**:
   ```sql
   -- Find orphaned SMS (should be empty after fix)
   SELECT id, phoneNumber, studentId FROM SmsMessage WHERE direction = 'INBOUND' AND studentId IS NULL;
   
   -- Verify linkage
   SELECT COUNT(*) FROM SmsMessage WHERE studentId IS NOT NULL;
   ```

4. **Verify webhook is running**:
   - Check TextBee webhook configuration
   - Ensure endpoint receives POST requests
   - Check for webhook errors in application logs

---

## Why This Fix Works

### Before
- Inbound SMS: `studentId = null` → No Student relationship → Not found by inbox query
- Result: SMS in database but hidden from UI

### After
- Inbound SMS: `studentId = UUID` → Links to Student → Found by inbox query  
- Result: SMS appears in UI and messaging interface

### The Query
```prisma
// app/api/admin/sms/inbox/route.ts:185
const studentsWithMessages = await prisma.student.findMany({
  where: {
    smsMessages: { some: {} }  // Find students WITH SMS
  },
  select: {
    id, name, studentId, phone,
    smsMessages: { ... }
  }
})
```

With `studentId` properly set, this query now finds all students with SMS conversations.

---

## Questions?

If SMS still don't appear after applying the fix:
1. Check backfill script output for "not found" phone numbers
2. Verify phone number formats match between Student and SmsMessage records
3. Check application logs for webhook errors
4. Ensure webhook is receiving messages from TextBee
