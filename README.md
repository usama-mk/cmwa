# Client Management Web App

A modern client management application built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication**: Secure login/signup with role-based access (Client/Admin)
- **Project Management**: Create, update, and track project progress
- **Real-time Updates**: Live project status and progress tracking
- **Email Notifications**: Automatic email alerts for project updates
- **Responsive Design**: Works perfectly on desktop and mobile
- **Dark Mode**: Toggle between light and dark themes
- **Drive Integration**: Clients can share Google Drive links

## Email Notifications Setup

The app includes automatic email notifications for project updates. To enable this feature:

### 1. Sign up for Resend

1. Go to [Resend.com](https://resend.com) and create an account
2. Verify your domain or use their test domain for development
3. Get your API key from the dashboard

### 2. Configure Supabase Environment Variables

1. Go to your Supabase project dashboard
2. Navigate to Settings → Edge Functions
3. Add the following environment variable:
   - `RESEND_API_KEY`: Your Resend API key

### 3. Update Email Configuration

In `supabase/functions/send-project-update-email/index.ts`, update:

- The `from` email address to match your verified domain
- The `SITE_URL` environment variable or hardcode your app URL

### 4. Email Triggers

Emails are automatically sent when:

- **Status changes**: Any project status update
- **Progress updates**: When progress changes by 10% or more
- **General updates**: When significant notes are added

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Email**: Resend API
- **Icons**: Lucide React
- **Deployment**: Netlify

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your Supabase project and add environment variables
4. Run the development server: `npm run dev`

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The app uses the following main tables:

- `profiles`: User profiles with roles (client/admin)
- `projects`: Project information and status
- `project_updates`: Project update history

## Deployment

The app is configured for Netlify deployment with proper redirects for SPA routing.

### Quick Deploy to Netlify

1. **Build the project**: `npm run build`
2. **Deploy to Netlify**:
   - Connect your Git repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables (see DEPLOYMENT.md)

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md) and [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md).

## License

MIT License
# cmwa-em
# cmwa
# cmwa
