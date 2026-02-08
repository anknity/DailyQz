# DailyQ Frontend Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- Firebase Project (Web App configured)
- Backend API running

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-frontend-repo-url>
   cd dailyq-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Then fill in your actual values in `.env`:

   ### Firebase Web App Setup
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → General → Your Apps
   - If you don't have a web app, click "Add App" and select Web
   - Copy the Firebase configuration values to your `.env`:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
     ```

   ### Backend API URL
   - For local development: `VITE_API_URL=http://localhost:5000/api`
   - For production: Update with your deployed backend URL

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   ```

## Important Security Notes

⚠️ **NEVER commit the following files:**
- `.env` (contains Firebase configuration)
- Any files with API keys

✅ **Safe to commit:**
- `.env.example` (template without real values)
- Source code files
- Public assets

⚠️ **Note about Frontend Environment Variables:**
- Vite exposes environment variables starting with `VITE_` to the client
- These values will be visible in the browser's source code
- Firebase web config is safe to expose (it's meant for client-side use)
- Never put sensitive backend secrets in frontend .env

## Features

- 🔐 Firebase Authentication (Email/Password & Google Sign-In)
- 📝 Multiple Choice Questions (MCQs) across various categories
- ⏱️ Timed Tests
- 📊 Real-time Leaderboards
- 🎯 Performance Analytics
- 🌙 Dark/Light Theme
- 📱 Responsive Design
- 🎨 Smooth Animations

## Available Categories

- Web Development (HTML/CSS, JavaScript, React, Tailwind)
- Data Structures & Algorithms
- Aptitude (Quantitative, Logical, Verbal)
- NEET (Physics, Chemistry, Biology)
- Data Science
- Networking
- Artificial Intelligence

## Admin Features

Admin access is restricted to the email configured in backend's `ADMIN_EMAIL`.

Admin can:
- View dashboard statistics
- Generate questions using AI (Gemini)
- Upload questions via JSON
- Manage existing questions
- View all users

## Project Structure

```
frontend/
├── public/
│   ├── DailiQ.png              # App logo
│   └── index.html
├── src/
│   ├── components/             # Reusable components
│   ├── context/                # React Context (Auth, Theme, Test)
│   ├── pages/                  # Page components
│   ├── services/               # API services
│   ├── utils/                  # Helper functions
│   ├── firebase/               # Firebase configuration
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # Entry point
├── .env                        # Environment variables (NEVER COMMIT)
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── tailwind.config.js          # Tailwind CSS config
├── vite.config.js              # Vite config
└── package.json                # Dependencies
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify
1. Push your code to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in Netlify dashboard

### Important for Production
- Update `VITE_API_URL` to your production backend URL
- Ensure CORS is properly configured in backend
- Test all features after deployment

## Troubleshooting

### "Firebase: Error (auth/...)" errors
- Verify Firebase configuration in `.env`
- Check Firebase Console for authentication settings
- Enable Email/Password and Google sign-in methods

### "Failed to fetch" errors
- Ensure backend is running
- Check `VITE_API_URL` is correct
- Verify CORS settings in backend

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
