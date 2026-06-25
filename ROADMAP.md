# Roadmap and Process

## Phase 1 — Local Setup

1. Extract the project folder.
2. Open it in VS Code.
3. Create `.env.local` from `.env.example`.
4. Add Gmail credentials.
5. Run:

```bash
npm install
npm run dev
```

6. Upload the sample Excel file.
7. Run Preview mode first.

## Phase 2 — Safe Email Testing

1. Set mode to `test-one`.
2. Add your own test email address.
3. Click Send.
4. Confirm the email formatting looks correct.
5. Confirm attachments work.

## Phase 3 — First Real Batch

1. Set mode to `send-batch`.
2. Set batch limit to 5.
3. Use delay 1–3 seconds.
4. Send.
5. Download the updated Excel file.
6. Open it and confirm statuses.

## Phase 4 — Real Workflow

1. Upload the latest updated Excel file every time.
2. Never clear `sent_emails` unless you intentionally want to send again.
3. Keep batches small.
4. Stop if Gmail shows warnings or bounces increase.

## Phase 5 — Deploy on Netlify

1. Push code to GitHub.
2. Import repo in Netlify.
3. Use build command: `npm run build`
4. Use publish directory: `.next`
5. Add environment variables:
   - `GMAIL_EMAIL`
   - `GMAIL_APP_PASSWORD`
   - `EMAIL_SENDER_NAME`
   - `SMTP_HOST`
   - `SMTP_PORT`
6. Deploy.
7. Test with `test-one` mode.

## Phase 6 — Production Upgrade

For a serious SaaS version, add:

- Login system
- Database for campaigns
- Queue-based sending
- Gmail API OAuth instead of App Password
- Reply tracking
- Bounce tracking
- User roles
- Campaign analytics
- Scheduled follow-ups
- Unsubscribe management

## Senior Developer Note

Netlify is good for the UI and small batch sending. For long campaigns with delays and scheduled follow-ups, use a background worker such as:

- Supabase Edge Functions + database
- Google Cloud Run
- AWS Lambda + SQS
- Railway worker
- Trigger.dev
- Inngest
