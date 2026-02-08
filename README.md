# DailyQ - MCQ Test Platform (Frontend)

A modern, interactive MCQ test platform built with React, Vite, and Firebase.

## 🚀 Features

- **User Authentication**: Email/Password and Google Sign-In
- **Daily MCQ Tests**: 20 random questions from 5 categories
- **AI Mix Mode**: Smart difficulty distribution (40% Easy, 40% Medium, 20% Hard)
- **25-Minute Timer**: Countdown timer with auto-submit
- **60-Second Suspense**: Exciting reveal screen after submission
- **Daily Streak System**: Track your learning consistency
- **Leaderboards**: Daily, Weekly, and All-Time rankings
- **Dark Mode**: Beautiful dark theme support
- **Responsive Design**: Works on all devices

## 📚 Categories

- Web Development (HTML, CSS, JavaScript, React)
- Artificial Intelligence
- Data Science
- Networking
- Data Structures & Algorithms

## 🛠️ Tech Stack

- **React 18** - UI Library
- **Vite 5** - Build Tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router DOM** - Routing
- **Firebase** - Authentication & Database

## 📦 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your Firebase credentials
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_API_URL=http://localhost:5000/api
```

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers
│   ├── data/           # Static data (questions)
│   ├── firebase/       # Firebase configuration
│   ├── pages/          # Page components
│   ├── services/       # API services
│   └── utils/          # Utility functions
├── public/
├── .env.example
├── .gitignore
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 📱 Pages

- `/login` - User login
- `/register` - User registration
- `/` - Dashboard (home)
- `/instructions` - Test instructions
- `/test` - Take the test
- `/suspense` - 60-second suspense screen
- `/result` - Test results
- `/profile` - User profile
- `/leaderboard` - Rankings

## 🎨 Design Features

- Modern gradient backgrounds
- Smooth animations with Framer Motion
- Responsive card-based layout
- Interactive question palette
- Progress indicators
- Achievement badges

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔒 Security Features

- Protected routes for authenticated users
- Anti-cheat measures (disabled right-click, text selection)
- Secure Firebase authentication
- Environment variable protection

## 📄 License

MIT License
