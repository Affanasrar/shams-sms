# Vercel Cron Job Setup

## ✅ You're All Set!

Your `vercel.json` is configured with:
```json
{
  "crons": [
    {
      "path": "/api/cron/fees",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## What This Does:
- **Runs Daily**: Every day at midnight (00:00 UTC)
- **Automatic**: No manual setup needed
- **Reliable**: Vercel handles the scheduling
- **Scalable**: Works with your deployment

## Next Steps:
1. **Deploy to Vercel**: `vercel --prod`
2. **Monitor Logs**: Check Vercel dashboard for cron execution logs
3. **Test**: The cron will run automatically at midnight UTC

## Timezone Note:
- Cron runs at **00:00 UTC** (8:00 PM PST, 11:00 PM EST, etc.)
- Adjust schedule in `vercel.json` if needed

## Manual Testing:
```bash
curl -X GET https://your-app.vercel.app/api/cron/fees
curl -X GET https://your-app.vercel.app/api/cron/fees-reminder
```

## Automatic Fee Reminder Cron
Your `vercel.json` now includes a second daily cron endpoint:
```json
{
  "path": "/api/cron/fees-reminder",
  "schedule": "0 0 * * *"
}
```

This endpoint automatically sends SMS reminders for unpaid or overdue fees once the due date has arrived and keeps a persistent reminder log.

## Textbee SMS Setup
To send due-date SMS notifications through Textbee, configure these environment variables in your deployment environment:
- `TEXTBEE_BASE_URL` (optional, defaults to https://api.textbee.dev for cloud service, or your self-hosted URL)
- `TEXTBEE_API_KEY`
- `TEXTBEE_DEVICE_ID`

These values come from your Textbee dashboard (or your self-hosted Textbee instance).

SMS reminders are now sent automatically by the new Vercel cron endpoint at `/api/cron/fees-reminder`, while the admin dashboard at `/admin/sms` still supports manual SMS sending.

That's it! Your fee generation and overdue reminders are now automated on Vercel! 🎉