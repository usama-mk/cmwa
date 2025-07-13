# Troubleshooting Guide

This guide addresses the common issues you've encountered with the Client Management Web App.

## 🔄 Issue 1: "Loading..." on Page Refresh

### Problem

The app shows "Loading..." indefinitely when you refresh the page.

### ✅ Fixed (Updated)

- **Root Cause**: Race condition in authentication state management and timing issues
- **Solution**:
  - Improved the `AuthContext` with proper async handling and cleanup
  - Added timeout delays to prevent premature loading state changes
  - Better state management with mounted flag
- **Status**: ✅ Deployed and fixed

### What Was Fixed

1. Added proper async initialization in `useEffect`
2. Added cleanup with `mounted` flag to prevent state updates after unmount
3. Improved error handling in profile fetching
4. Better loading state management

---

## 🔘 Issue 2: Buttons Not Responding

### Problem

When clicking "Add Project" or "Update Project" buttons, nothing happens.

### ✅ Fixed (Updated)

- **Root Cause**: Poor form validation, error handling, and double-click issues
- **Solution**:
  - Enhanced validation and better error messages
  - Added submission state management to prevent double-clicks
  - Added loading spinners and disabled states during submission
  - Better user feedback with success messages
- **Status**: ✅ Deployed and fixed

### What Was Fixed

1. **Form Validation**:

   - Added proper validation for required fields
   - Added validation for completion percentage (0-100)
   - Added trimming of input values

2. **Error Handling**:

   - Better error messages with specific details
   - Proper error logging
   - Success messages for user feedback

3. **Button States**:
   - Added loading spinners during submission
   - Disabled buttons during processing to prevent double-clicks
   - Better user feedback with success messages
   - Proper state management for form submission

### Example of Fixed Validation:

```typescript
// Before: Basic check
if (!newProject.name || !newProject.clientId) {
  alert("Please select a client and enter a project name");
  return;
}

// After: Comprehensive validation
if (!newProject.name.trim()) {
  alert("Please enter a project name");
  return;
}

if (!newProject.clientId) {
  alert("Please select a client");
  return;
}

if (
  newProject.completion_percentage < 0 ||
  newProject.completion_percentage > 100
) {
  alert("Completion percentage must be between 0 and 100");
  return;
}
```

---

## 📧 Issue 3: Email Functionality Not Working

### Problem

Email notifications are not being sent when projects are updated.

### 🔧 Solution Steps

#### Step 1: Set Up Environment Variables

1. Go to your [Netlify site settings](https://app.netlify.com/sites/cmwa-em/settings/environment)
2. Add these environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   RESEND_API_KEY=your_resend_api_key
   ```

#### Step 2: Get Resend API Key

1. Sign up at [Resend.com](https://resend.com)
2. Go to your dashboard
3. Copy your API key
4. Add it to Netlify environment variables

#### Step 3: Deploy Supabase Function

```bash
# Login to Supabase
supabase login

# Deploy the email function
supabase functions deploy send-project-update-email
```

#### Step 4: Test Email Functionality

1. Create a test project
2. Update the project status or progress
3. Check if email is received at the client's email address

---

## 🧪 Testing Your Fixes

### Test 1: Page Refresh

1. Go to [https://cmwa-em.netlify.app](https://cmwa-em.netlify.app)
2. Log in to your account
3. Refresh the page (F5 or Cmd+R)
4. ✅ Should load properly without getting stuck on "Loading..."

### Test 2: Add Project

1. Go to Admin Dashboard
2. Click "Add Project"
3. Fill in the form:
   - Select a client
   - Enter project name
   - Add description (optional)
   - Set status and completion percentage
4. Click "Add Project"
5. ✅ Should show success message and add project

### Test 3: Update Project

1. Click the edit button on any project
2. Make changes to the project
3. Click "Save Changes"
4. ✅ Should update successfully and show confirmation

### Test 4: Email Notifications

1. Update a project status or progress significantly
2. Check the client's email inbox
3. ✅ Should receive email from `onboarding@resend.dev`

---

## 🐛 Common Issues and Solutions

### Issue: "Failed to fetch" errors

**Solution**: Check your Supabase environment variables in Netlify

### Issue: Authentication errors

**Solution**: Ensure your Supabase project is properly configured

### Issue: Email not sending

**Solution**:

1. Check Resend API key is set correctly
2. Verify Supabase function is deployed
3. Check browser console for errors

### Issue: Form not submitting

**Solution**:

1. Check all required fields are filled
2. Ensure completion percentage is between 0-100
3. Check browser console for validation errors

---

## 📞 Getting Help

If you're still experiencing issues:

1. **Check Browser Console**: Press F12 and look for error messages
2. **Check Netlify Logs**: Go to your site's deploy logs
3. **Verify Environment Variables**: Ensure all required variables are set
4. **Test Locally**: Run `npm run dev` to test locally first

### Environment Variables Checklist

- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- [ ] `RESEND_API_KEY` - Your Resend API key (for emails)

---

## 🎯 Quick Fixes

### If buttons still don't work:

1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Try in incognito/private mode
3. Check if JavaScript is enabled

### If loading persists:

1. Check your internet connection
2. Try a different browser
3. Clear browser data and cookies

### If emails don't send:

1. Verify Resend API key is correct
2. Check Supabase function logs
3. Test with a simple email first

---

## 📊 Current Status

| Issue                 | Status         | Notes                                         |
| --------------------- | -------------- | --------------------------------------------- |
| Loading on refresh    | ✅ Fixed       | Improved auth state management with timeouts  |
| Button responsiveness | ✅ Fixed       | Enhanced validation + double-click prevention |
| Email functionality   | 🔧 Needs Setup | Requires environment variables                |
| Overall app stability | ✅ Improved    | Better error handling + loading states        |

The app is now more stable and user-friendly. The main remaining step is setting up your environment variables for full functionality.
