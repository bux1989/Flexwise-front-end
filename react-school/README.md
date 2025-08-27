# School Management System - React Version

A clean React conversion of the WeWeb school management app, focusing on login and teacher dashboard functionality.

## Features

- **Login Page**: Clean authentication with Supabase
- **Teacher Dashboard**: Schedule view, attendance tracking, real-time updates
- **Self-hosted ready**: Built for your own infrastructure

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Supabase:
Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Start development server:
```bash
npm run dev
```

## Demo Credentials

For testing without Supabase setup:
- Email: teacher@school.com
- Password: demo123

## Pages

- `/` - Redirects to dashboard if logged in, otherwise login
- `/login` - Login page
- `/dashboard/teacher` - Teacher dashboard

## Tech Stack

- React 18 + Vite
- React Router for navigation
- Supabase for authentication & database
- Tailwind CSS for styling

## Deployment

Built for self-hosting. After `npm run build`, deploy the `dist` folder to your server.
