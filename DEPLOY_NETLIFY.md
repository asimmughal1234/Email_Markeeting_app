# Deploy to Netlify

## 1. Push to GitHub

Create a GitHub repository and push this project.

## 2. Import in Netlify

Netlify dashboard → Add new site → Import from Git.

## 3. Build settings

```text
Build command: npm run build
Publish directory: .next
```

## 4. Environment variables

Add these in Netlify:

```env
GMAIL_EMAIL=yourgmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password
EMAIL_SENDER_NAME=Muhammad Asim
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
MAX_ATTACHMENT_MB=10
```

## 5. Deploy

After deployment, test with:

```text
Send mode: test-one
```

Then test a real batch with a very small limit.
