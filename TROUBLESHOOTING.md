# Troubleshooting Guide

## Common Issues and Solutions

### 1. Loading State Issues

#### Problem: "Saving..." button gets stuck on second attempt

**Symptoms:**

- Button shows "Saving..." indefinitely after the first successful save
- Second attempt to save doesn't work
- Console shows "Already submitting, ignoring request"

**Solution:**

- The app now has improved state management to prevent this
- If it still happens, click the "Refresh" button in the admin dashboard
- Clear browser cache and reload the page

#### Problem: App shows "Loading..." indefinitely on refresh

**Symptoms:**

- Page shows loading spinner and never loads
- Console shows auth state changes but no data loads

**Solution:**

- Clear browser cache completely (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- If persistent, try opening in an incognito/private window

### 2. Authentication Issues

#### Problem: Can't log in or stuck on login page

**Check:**

- Ensure you're using the correct email and password
- Check if your account exists in the database
- Verify Supabase environment variables are set correctly

#### Problem: Logged out unexpectedly

**Solution:**

- This is normal behavior for security
- Simply log back in with your credentials

### 3. Email Notifications

#### Problem: Not receiving email notifications

**Check:**

1. **Environment Variables:**

   - Ensure `RESEND_API_KEY` is set in Supabase
   - Verify the API key is valid and has sending permissions

2. **Supabase Function:**

   - Check if the `send-project-update-email` function is deployed
   - Verify function logs in Supabase dashboard

3. **Email Address:**
   - Ensure the client's email address is correct
   - Check spam/junk folder

**Debug Steps:**

```bash
# Check Supabase function logs
supabase functions logs send-project-update-email
```

### 4. Database Issues

#### Problem: Can't add or update projects

**Check:**

- Verify database tables exist and have correct structure
- Check Supabase RLS (Row Level Security) policies
- Ensure user has proper permissions

#### Problem: Data not loading

**Solution:**

- Click the "Refresh" button in the admin dashboard
- Check browser console for errors
- Verify Supabase connection

### 5. Performance Issues

#### Problem: Slow loading or unresponsive UI

**Solutions:**

- Clear browser cache
- Check internet connection
- Try refreshing the page
- Use the "Refresh" button in the dashboard

### 6. Cache-Related Issues

#### Problem: Changes not appearing after updates

**Solutions:**

- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache completely
- Use the "Refresh" button in the admin dashboard
- Check if you're viewing the latest deployed version

### 7. Browser-Specific Issues

#### Chrome/Edge:

- Clear cache: Settings > Privacy and security > Clear browsing data
- Disable extensions temporarily
- Try incognito mode

#### Firefox:

- Clear cache: Options > Privacy & Security > Clear Data
- Try private browsing mode

#### Safari:

- Clear cache: Develop > Empty Caches
- Try private browsing mode

### 8. Network Issues

#### Problem: Can't connect to the app

**Check:**

- Internet connection
- Firewall settings
- VPN interference
- DNS issues

### 9. Development vs Production

#### Problem: Works locally but not on Netlify

**Check:**

- Environment variables are set in Netlify
- Build process completes successfully
- No console errors in production

### 10. Recent Fixes Applied

#### Loading State Management:

- Improved `isSubmitting` state reset logic
- Added timeout delays to prevent rapid state changes
- Enhanced error handling in form submissions

#### Cache Busting:

- Updated Netlify headers to prevent aggressive caching
- Added no-cache headers for JS and CSS files
- Reduced asset cache time to 5 minutes

#### Authentication Flow:

- Fixed race conditions in auth loading states
- Improved profile fetching timing
- Added proper cleanup on component unmount

### Emergency Reset

If all else fails:

1. Clear all browser data (cache, cookies, local storage)
2. Log out and log back in
3. Try a different browser
4. Contact support with specific error messages

### Getting Help

When reporting issues, please include:

- Browser and version
- Operating system
- Exact error messages from console
- Steps to reproduce the issue
- Screenshots if applicable
