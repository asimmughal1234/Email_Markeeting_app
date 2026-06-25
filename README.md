# Email Marketing Automation

A flexible Next.js web app for sending Gmail emails from Excel files.

Built for Muhammad Asim's AI automation outreach workflow.

## What This Version Adds

This web app includes the first 7 flexibility upgrades:

1. Configurable column names
2. Support for any `.xlsx` Excel file
3. `column_mapping.json` style mapping
4. Template selection
5. Campaign name tracking
6. Send modes: dry-run, test-one, send-batch
7. Attachment support

It also includes:

- Next.js frontend
- Animated modern UI
- Secure server-side Gmail sending
- Duplicate prevention
- Missing-email skipping
- Updated Excel file download after sending
- Netlify deployment setup

## Important Security Rule

Gmail credentials are used only inside server-side API routes.

Do not put your Gmail App Password in frontend code.

Use environment variables:

```env
GMAIL_EMAIL=yourgmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password
EMAIL_SENDER_NAME=Muhammad Asim
```

## Local Setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Setup

Copy:

```text
.env.example
```

Rename it to:

```text
.env.local
```

Fill in:

```env
GMAIL_EMAIL=yourgmail@gmail.com
GMAIL_APP_PASSWORD=your_16_character_gmail_app_password
EMAIL_SENDER_NAME=Muhammad Asim
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
```

## How to Use

1. Upload your Excel `.xlsx` file.
2. Enter the sheet name, or leave it blank to use the first sheet.
3. Confirm the column mapping.
4. Choose a template.
5. Click **Preview only**.
6. Send one test email to yourself.
7. Run a small real batch.
8. Download the updated Excel file.
9. Use the updated Excel file for the next batch.

## Why Download Updated Excel?

Netlify serverless functions do not permanently store uploaded files by default.

So after sending, the app returns an updated Excel file with:

```text
email_status
email_sent_at
email_error
sent_emails
campaign_name
```

Use this updated file for the next run to prevent duplicates.

## Recommended Batch Settings

For Gmail safety and Netlify function limits, use small batches:

```text
Batch limit: 5 to 10
Delay: 1 to 3 seconds
```

For larger production campaigns, move sending to a queue/background worker.

## Included Sample Data

A sample workbook is included in:

```text
sample-data/dubai_real_estate_leads_50_ready.xlsx
```

## Template Placeholders

Common placeholders:

```text
{business_name}
{email}
{phone_number}
{website}
{city}
{category}
{rating}
{number_of_reviews}
{google_maps_url}
```

These can be changed from the column mapping JSON.


## Latest UI Updates

This version includes a more premium web app interface:

- App name changed to `Email Marketing Automation`
- Sticky navbar with quick section navigation
- Light and dark mode toggle
- Rich animated background with mesh gradients, moving particles, grid motion, laser lines, fade-in sections, shine effects, and floating cards
- Upload section now only says `Upload Excel File`
- Hero quick buttons removed
- Result section includes a `Clear results` button
- Previous backend automation features remain unchanged


## Sender Gmail Feature

This version includes sender Gmail fields in the frontend:

```text
Sender Gmail
Gmail App Password
Sender Name
Reply-to Email
SMTP Host
SMTP Port
```

This solves the public deployment problem. Visitors should use their own Gmail account and App Password instead of sending through your Gmail.

Important security behavior:

- Sender Gmail and App Password are used only for the current request.
- They are not saved into Excel.
- They are not returned in API responses.
- They are not stored by the app.
- `.env.local` is still ignored by Git.

If you want only selected people to use the app, add login/password protection before public sharing.

## Light Mode Font Fix

Light mode typography has been adjusted so normal text is no longer overly bold. Headings, buttons, brand text, and key labels remain bold, while paragraphs, fields, helper text, and general UI text use normal font weight.
