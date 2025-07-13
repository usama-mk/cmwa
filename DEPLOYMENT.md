# Netlify Deployment Guide

This guide will help you deploy the Client Management Web App to Netlify.

## Prerequisites

1. **Supabase Project**: Make sure your Supabase project is set up and running
2. **Resend Account**: For email notifications (optional but recommended)
3. **GitHub/GitLab Repository**: Your code should be in a Git repository

## Step 1: Environment Variables Setup

Before deploying, you need to set up the following environment variables in Netlify:

### Required Environment Variables

1. `VITE_SUPABASE_URL`: Your Supabase project URL
2. `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

### Optional Environment Variables (for email notifications)

3. `RESEND_API_KEY`: Your Resend API key (if using email notifications)

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify UI (Recommended)

1. **Connect Repository**:

   - Go to [Netlify](https://netlify.com) and sign in
   - Click "New site from Git"
   - Choose your Git provider (GitHub, GitLab, etc.)
   - Select your repository

2. **Configure Build Settings**:

   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18` (or higher)

3. **Set Environment Variables**:

   - Go to Site settings → Environment variables
   - Add the required environment variables listed above

4. **Deploy**:
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**:

   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:

   ```bash
   netlify login
   ```

3. **Initialize and Deploy**:

   ```bash
   # Build the project
   npm run build

   # Deploy to Netlify
   netlify deploy --prod --dir=dist
   ```

## Step 3: Configure Custom Domain (Optional)

1. Go to your Netlify site dashboard
2. Navigate to Domain settings
3. Add your custom domain
4. Configure DNS settings as instructed by Netlify

## Step 4: Verify Deployment

After deployment, verify that:

1. **Authentication works**: Try logging in with test credentials
2. **Database connection**: Create a test project to ensure Supabase is connected
3. **Email notifications**: If configured, test the email functionality
4. **Routing**: Navigate through different pages to ensure SPA routing works

## Troubleshooting

### Common Issues

1. **Build Failures**:

   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility
   - Check build logs in Netlify dashboard

2. **Environment Variables**:

   - Ensure all required variables are set in Netlify
   - Check that variable names start with `VITE_` for client-side access
   - Verify Supabase URL and keys are correct

3. **Routing Issues**:

   - The `_redirects` file and `netlify.toml` should handle SPA routing
   - If issues persist, check the redirects configuration

4. **CORS Issues**:
   - Ensure Supabase project allows your Netlify domain
   - Check Supabase authentication settings

### Performance Optimization

The deployment includes:

- Asset caching for better performance
- Security headers for protection
- Optimized build output
- Gzip compression (handled by Netlify)

## Monitoring and Analytics

1. **Netlify Analytics**: Enable in site settings for basic analytics
2. **Error Tracking**: Consider adding error tracking (Sentry, etc.)
3. **Performance Monitoring**: Use Netlify's built-in performance insights

## Continuous Deployment

Once deployed, Netlify will automatically:

- Deploy on every push to your main branch
- Create preview deployments for pull requests
- Rollback to previous versions if needed

## Support

If you encounter issues:

1. Check Netlify build logs
2. Verify environment variables
3. Test locally with `npm run build` and `npm run preview`
4. Check Supabase dashboard for any backend issues
