# Email Setup Guide - No Domain Verification Required

This guide shows you how to set up email notifications using free services that don't require domain verification.

## 🚀 Option 1: Resend (Recommended - Already Updated)

**Status**: ✅ Ready to use with test domain

### Setup Steps:

1. **Sign up at [Resend.com](https://resend.com)**
2. **Get your API key** from the dashboard
3. **Add to Netlify environment variables**:
   - `RESEND_API_KEY` = Your Resend API key

### Configuration:

- **From email**: `onboarding@resend.dev` (no verification needed)
- **Free tier**: 3,000 emails/month
- **Already configured** in your project

---

## 📧 Option 2: SendGrid (Alternative)

### Setup Steps:

1. **Sign up at [SendGrid.com](https://sendgrid.com)**
2. **Get your API key** from Settings → API Keys
3. **Update the email function** (see below)

### Configuration:

- **From email**: `noreply@sendgrid.net` or your verified sender
- **Free tier**: 100 emails/day
- **No domain verification** for basic sending

### Code Update:

```typescript
// Replace the Resend API call with SendGrid
const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SENDGRID_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: "noreply@sendgrid.net" },
    subject: subject,
    content: [{ type: "text/html", value: htmlContent }],
  }),
});
```

---

## 📮 Option 3: Mailgun (Developer Friendly)

### Setup Steps:

1. **Sign up at [Mailgun.com](https://mailgun.com)**
2. **Get your API key** from Settings → API Keys
3. **Use sandbox domain** (no verification needed)

### Configuration:

- **From email**: `postmaster@sandbox.mailgun.org`
- **Free tier**: 5,000 emails/month for 3 months
- **Sandbox domain** available immediately

### Code Update:

```typescript
// Replace with Mailgun API call
const emailResponse = await fetch(
  `https://api.mailgun.net/v3/sandbox.mailgun.org/messages`,
  {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      from: "postmaster@sandbox.mailgun.org",
      to: to,
      subject: subject,
      html: htmlContent,
    }),
  }
);
```

---

## 🔧 Quick Setup Instructions

### For Resend (Current Setup):

1. **Get API Key**:

   - Go to [Resend.com](https://resend.com)
   - Sign up and verify your account
   - Copy your API key from the dashboard

2. **Add to Netlify**:

   - Go to your Netlify site: https://app.netlify.com/projects/cmwa-em
   - Navigate to **Site settings** → **Environment variables**
   - Add: `RESEND_API_KEY` = `your_api_key_here`

3. **Deploy the updated function**:
   ```bash
   supabase functions deploy send-project-update-email
   ```

### For Other Services:

1. **Choose your service** from the options above
2. **Update the email function** with the new API code
3. **Add the new API key** to Netlify environment variables
4. **Deploy the updated function**

---

## 🧪 Testing Email Functionality

### Test the current setup:

1. **Create a test project** in your app
2. **Update the project status** or progress
3. **Check if email is received** at the client's email address

### Manual testing:

```bash
# Test the email function directly
curl -X POST https://your-project.supabase.co/functions/v1/send-project-update-email \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "clientName": "Test Client",
    "projectName": "Test Project",
    "updateType": "status",
    "oldValue": "planning",
    "newValue": "in_progress"
  }'
```

---

## 📊 Service Comparison

| Service      | Free Tier         | From Email                       | Domain Verification | Setup Difficulty |
| ------------ | ----------------- | -------------------------------- | ------------------- | ---------------- |
| **Resend**   | 3,000/month       | `onboarding@resend.dev`          | ❌ No               | ⭐ Easy          |
| **SendGrid** | 100/day           | `noreply@sendgrid.net`           | ❌ No               | ⭐⭐ Medium      |
| **Mailgun**  | 5,000/month (3mo) | `postmaster@sandbox.mailgun.org` | ❌ No               | ⭐⭐ Medium      |

---

## 🎯 Recommendation

**Use Resend** - it's already configured and ready to go! Just:

1. Sign up at Resend.com
2. Get your API key
3. Add it to Netlify environment variables
4. Deploy the function

The email function is already updated to use `onboarding@resend.dev` which doesn't require any domain verification.
