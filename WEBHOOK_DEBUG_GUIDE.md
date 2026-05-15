# SMS Webhook Diagnosis Guide

## Quick Checklist

### 1. Is the webhook endpoint registered in TextBee?
- [ ] Go to TextBee dashboard (https://textbee-rho.vercel.app/)
- [ ] Check webhook settings/configuration
- [ ] Verify webhook URL: `https://your-app.com/api/webhooks/textbee`
- [ ] Verify webhook secret is set and matches `TEXTBEE_WEBHOOK_SECRET` env var

### 2. Is the environment variable set?
```bash
# Check if TEXTBEE_WEBHOOK_SECRET is configured
echo $TEXTBEE_WEBHOOK_SECRET
# Or in .env file:
cat .env | grep TEXTBEE_WEBHOOK_SECRET
```

### 3. Test webhook connectivity
```bash
# Send a test webhook from your app's endpoint
curl -X POST https://your-app.com/api/webhooks/textbee \
  -H "Content-Type: application/json" \
  -H "X-Signature: test-signature" \
  -d '{
    "webhookEvent": "MESSAGE_RECEIVED",
    "smsId": "test-123",
    "sender": "+923001234567",
    "message": "Test message",
    "deviceId": "device-1"
  }'
```

### 4. Check application logs
- [ ] Check Vercel deployment logs: `vercel logs`
- [ ] Check local server logs: `npm run dev` and watch console
- [ ] Look for errors or warnings related to webhook

---

## Security & Implementation Guide

### Overview
The TextBee webhook uses HMAC-SHA256 signing with the webhook secret configured in `TEXTBEE_WEBHOOK_SECRET`.
The request body must be hashed exactly as delivered, and the signature must be validated before any SMS is stored.
If signature verification fails, the webhook returns `401` and the SMS is not persisted.

> Note: TextBee webhooks are supported on the Free plan, so you do not need Vercel Pro for inbound webhook delivery.

### Payload
Inbound SMS webhook payloads should look like this:
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

### Verification
The app verifies `X-Signature` with the shared secret:
- Use `sha256` HMAC
- Hash the raw JSON body text
- Compare the signature in a timing-safe way
- Accept `sha256=` prefixed signatures if the provider sends that format

### Node.js Example
```js
const crypto = require('crypto')

function verifyWebhookSignature(payloadBody, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payloadBody).digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}

app.post('/webhook', express.json(), (req, res) => {
  const signature = req.headers['x-signature']
  const payloadBody = JSON.stringify(req.body)

  if (!verifyWebhookSignature(payloadBody, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // Process the webhook payload
  console.log('Webhook verified:', req.body)
  res.status(200).send('OK')
})
```

### Python Example
```py
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)

SECRET = b'your-webhook-secret'

def verify_webhook_signature(payload_body: bytes, signature: str, secret: bytes) -> bool:
    digest = hmac.new(secret, payload_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, digest)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Signature')
    body = request.get_data()

    if not verify_webhook_signature(body, signature, SECRET):
        return jsonify({'error': 'Invalid signature'}), 401

    payload = request.json
    print('Webhook verified:', payload)
    return 'OK', 200
```

### When SMS Aren't Stored
If webhook calls succeed but SMS are still not stored, check:
- `TEXTBEE_WEBHOOK_SECRET` matches the TextBee webhook secret
- `X-Signature` is present and valid
- The webhook endpoint path is correct
- Incoming payload fields are present and include `sender`
- The application logs show the webhook handler processing the event

---

### 5. Verify database connection
```bash
# Connect to your database and run:
SELECT COUNT(*) FROM "SmsMessage";
# Should show total SMS count
```

---

## Common Issues & Solutions

### Issue 1: "TEXTBEE_WEBHOOK_SECRET environment variable is not set"
**Solution**: Add to `.env` file or Vercel environment variables
```
TEXTBEE_WEBHOOK_SECRET=your_secret_from_textbee
```

### Issue 2: "Invalid webhook signature"
**Possible causes**:
- Webhook secret doesn't match between TextBee and your app
- TextBee webhook secret changed
- Signature verification algorithm mismatch

**Solution**:
1. Go to TextBee → Webhook settings
2. Copy the exact secret
3. Update `TEXTBEE_WEBHOOK_SECRET` in your `.env`
4. Restart your application

### Issue 3: Webhook not being called at all
**Possible causes**:
- Webhook URL not registered in TextBee
- Network firewall blocking the request
- TextBee account not configured for webhooks

**Solution**:
1. Verify webhook URL in TextBee matches your app domain
2. Check TextBee documentation for webhook setup
3. Test with a simpler endpoint first (without signature verification)

### Issue 4: Database connection failing
**Possible causes**:
- Database URL incorrect
- Database server down
- Connection timeout

**Solution**:
```bash
# Test database connection
npm run prisma:studio
# Or in code:
npx prisma db push
```

---

## Debug Mode: Enable Detailed Logging

See `debug-webhook.ts` for a version that logs all requests without signature verification.
Use this to test if TextBee is even sending requests to your endpoint.

---

## Step-by-Step Debug Process

### Step 1: Verify Webhook URL
1. Check TextBee settings: What webhook URL is configured?
2. Expected format: `https://yourdomain.com/api/webhooks/textbee`
3. Verify the domain is correct and publicly accessible

### Step 2: Test the Endpoint
```bash
# Test if endpoint exists and responds
curl -X GET https://yourdomain.com/api/webhooks/textbee
# Should return 405 (Method Not Allowed) for GET
```

### Step 3: Check Environment Variables
```bash
# Vercel
vercel env ls

# Or local .env file
cat .env | grep -i textbee
```

### Step 4: Monitor Logs During Message
1. Open your app in dev mode: `npm run dev`
2. Send a test SMS via TextBee dashboard
3. Watch console for any console.log() messages
4. Look for "Processing Textbee webhook event"

### Step 5: Check Database Directly
```bash
# Using Prisma Studio
npx prisma studio

# Or direct database query
SELECT * FROM "SmsMessage" ORDER BY "createdAt" DESC LIMIT 10;
```

---

## If Still Not Working

Check these files for the actual problem:

1. **Webhook Handler**: `app/api/webhooks/textbee/route.ts`
   - Is it receiving requests? (Add logging)
   - Is signature verification passing?
   - Is database save working?

2. **Environment Variables**: Check `.env` and Vercel settings
   - `TEXTBEE_WEBHOOK_SECRET` must match TextBee's secret
   - `DATABASE_URL` must be valid

3. **TextBee Configuration**: In TextBee dashboard
   - Webhook URL must be correct
   - Webhook must be enabled
   - Secret must match your app's secret

4. **Network**: Check if requests can reach your app
   - If behind firewall/VPN, may need to whitelist TextBee IPs
   - Check CORS/headers if webhook comes from browser

---

## Questions to Answer

To help debug, answer these:
1. Can you confirm the webhook URL in TextBee settings?
2. What is your app's domain? (production URL)
3. Can you send a test SMS via TextBee and watch the server logs?
4. What errors/logs appear when you send a test SMS?
5. Does the database have ANY SmsMessage records?
