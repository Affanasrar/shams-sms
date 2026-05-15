# Textbee Webhook Setup Guide

## Webhook Endpoint

Your webhook endpoint is now ready to receive SMS events from Textbee.

**Production URL:**
```
https://yourdomain.com/api/webhooks/textbee
```

**Local Development URL (for testing):**
```
https://your-ngrok-url.ngrok.io/api/webhooks/textbee
```

## Configuration

### 1. Environment Variable

Add your Textbee webhook secret to `.env.local`:

```env
TEXTBEE_WEBHOOK_SECRET=your-signing-secret-from-textbee-dashboard
```

### 2. Textbee Dashboard Setup

1. Go to **Textbee Dashboard** → **Webhooks**
2. Click **Create Webhook**
3. Configure:
   - **Delivery URL:** `https://yourdomain.com/api/webhooks/textbee`
   - **Signing Secret:** Copy from Textbee dashboard and paste into `TEXTBEE_WEBHOOK_SECRET` env var
   - **Events to subscribe:** Select all 4 events:
     - ✅ Message Received
     - ✅ Message Sent
     - ✅ Message Delivered
     - ✅ Message Failed
4. Click **Create**

## Webhook Events Handled

### 1. MESSAGE_RECEIVED
**When:** Inbound SMS arrives on your device
**Action:** Creates new `SmsMessage` record with `direction: INBOUND`

```json
{
  "webhookEvent": "MESSAGE_RECEIVED",
  "smsId": "smsId",
  "sender": "+923001234567",
  "message": "Hello from customer",
  "receivedAt": "2025-10-05T13:00:35.208Z",
  "deviceId": "deviceId"
}
```

### 2. MESSAGE_SENT
**When:** SMS is sent through Textbee API
**Action:** Updates SMS status to `SENT`

```json
{
  "webhookEvent": "MESSAGE_SENT",
  "smsId": "smsId",
  "recipient": "+923001234567",
  "message": "Your message",
  "status": "sent",
  "sentAt": "2025-10-05T13:00:35.208Z"
}
```

### 3. MESSAGE_DELIVERED
**When:** SMS is confirmed delivered by carrier
**Action:** Updates SMS status to `DELIVERED`

```json
{
  "webhookEvent": "MESSAGE_DELIVERED",
  "smsId": "smsId",
  "recipient": "+923001234567",
  "status": "delivered",
  "sentAt": "2025-10-05T13:00:35.208Z",
  "deliveredAt": "2025-10-05T13:00:45.208Z"
}
```

### 4. MESSAGE_FAILED
**When:** SMS delivery fails
**Action:** Updates SMS status to `FAILED` and logs error

```json
{
  "webhookEvent": "MESSAGE_FAILED",
  "smsId": "smsId",
  "recipient": "+923001234567",
  "status": "failed",
  "errorCode": "INVALID_NUMBER",
  "errorMessage": "Invalid phone number",
  "failedAt": "2025-10-05T13:00:35.208Z"
}
```

## Database Updates

The webhook automatically updates the `SmsMessage` table:

| Event | Database Field | Value |
|-------|---|---|
| MESSAGE_RECEIVED | `direction` | `INBOUND` |
| MESSAGE_RECEIVED | `status` | `DELIVERED` |
| MESSAGE_RECEIVED | `receivedAt` | Event timestamp |
| MESSAGE_SENT | `status` | `SENT` |
| MESSAGE_SENT | `sentAt` | Event timestamp |
| MESSAGE_DELIVERED | `status` | `DELIVERED` |
| MESSAGE_DELIVERED | `deliveredAt` | Event timestamp |
| MESSAGE_FAILED | `status` | `FAILED` |
| MESSAGE_FAILED | `errorMsg` | `[ERROR_CODE] Error message` |
| MESSAGE_FAILED | `failedAt` | Event timestamp |

## Security

- ✅ **Signature Verification:** All webhooks are verified using HMAC-SHA256
- ✅ **Timing-Safe Comparison:** Protected against timing attacks
- ✅ **Environment Secret:** Webhook secret stored securely in `.env.local`

## Webhook Request/Response

**Webhook Timing Requirements:**
- ✅ Accept POST requests
- ✅ Return 2XX status code within 10 seconds
- ✅ Our endpoint acknowledges receipt immediately

**Retry Logic (if we don't respond with 2XX):**
- 3 minutes
- 5 minutes
- 30 minutes
- 1 hour
- 6 hours
- 1 day
- 3 days
- 7 days
- 30 days

## Testing Locally

### Option 1: Using ngrok

```bash
# Start ngrok tunnel (in another terminal)
ngrok http 3000

# Copy the HTTPS URL and use as webhook URL in Textbee dashboard
```

### Option 2: Using Vercel Edge Functions

Deploy to Vercel and use your production domain for testing.

### Option 3: Manual Testing

Test the webhook endpoint:

```bash
# Generate HMAC signature
PAYLOAD='{"webhookEvent":"MESSAGE_SENT","smsId":"test123","recipient":"+923001234567","message":"Test","status":"sent","sentAt":"2025-10-05T13:00:35.208Z"}'

SECRET="your-webhook-secret"

# macOS/Linux
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Send request
curl -X POST https://localhost:3000/api/webhooks/textbee \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

## Monitoring

Check webhook logs in:
- **Textbee Dashboard** → **Webhook Logs** (see delivery status)
- **Application Logs** → Look for "Textbee webhook" messages
- **Database** → Query `SmsMessage` table for updated statuses

## Troubleshooting

### Webhook not triggering?
1. Verify signing secret matches exactly
2. Check that webhook is enabled in Textbee dashboard
3. Verify delivery URL is publicly accessible
4. Check logs in Textbee dashboard for failed attempts

### Signature verification failing?
1. Ensure `TEXTBEE_WEBHOOK_SECRET` is set correctly in `.env.local`
2. Whitespace in secret can cause issues - double-check
3. Verify X-Signature header is being sent by Textbee

### Status not updating?
1. Check application logs for errors
2. Verify `textbeeId` matches between API response and webhook event
3. Ensure database connection is working

## Next Steps

1. ✅ Deploy webhook code to production
2. ✅ Add `TEXTBEE_WEBHOOK_SECRET` to production environment variables
3. ✅ Configure webhook in Textbee dashboard with production URL
4. ✅ Test with MESSAGE_DELIVERED event
5. ✅ Monitor database for status updates
6. 📋 (Optional) Create dashboard to view inbox messages and delivery status
