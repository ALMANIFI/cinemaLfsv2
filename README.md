# 🎬 Cinema LFS v2

A modern cinema booking app built with React Native and Expo, featuring real-time trending movies, spike detection, and notification systems.

## 📱 Features

### Core Features
- **Trending Movies System**: Dynamic trending movies based on real-time ticket sales
- **Spike Detection**: Automatic detection and simulation of booking spikes
- **Notification System**: Real-time notifications for movie updates and new screenings
- **Showtime Management**: View and book movie showtimes with sold-out detection
- **User Profiles**: User management with notification preferences

### Advanced Features
- **Top 5 Trending**: Only the top 5 movies by ticket sales appear in trending section
- **Notification Queue**: Users can join queues for sold-out movies and get notified when new screenings open
- **Admin Dashboard**: Test dashboard for simulating booking spikes and managing notifications
- **Dynamic Badges**: Real-time "Selling Fast" badges and ranking indicators
- **New Screening Creation**: Admin can create new screenings and notify waiting users

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Custom AppStateService singleton
- **Notifications**: Expo Notifications + Firebase Cloud Messaging
- **Backend**: Firebase (Firestore, Realtime Database)
- **Styling**: React Native StyleSheet with custom theming

## 📁 Project Structure

```
cinemaLfsv2/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx           # Home screen with trending movies
│   │   ├── movies.tsx          # Movies catalog
│   │   ├── showtimes.tsx       # Showtimes with booking
│   │   ├── profile.tsx         # User profile & settings
│   │   └── test.tsx            # Admin test dashboard
├── components/
│   ├── ThemedText.tsx
│   ├── ThemedView.tsx
│   └── ui/
├── services/
│   ├── AppStateService.ts      # Global state management
│   ├── FirebaseService.ts      # Firebase integration
│   ├── NotificationService.ts  # Notification handling
│   └── UserService.ts          # User management
├── constants/
├── hooks/
└── images/
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- Android Studio or Xcode (for device testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cinemaLfsv2.git
cd cinemaLfsv2
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on device:
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

### Firebase Setup (Optional)

For full functionality, set up Firebase:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add your app to the project
3. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
4. Update `firebase.config.ts` with your project configuration
5. Enable Firestore, Authentication, and Cloud Messaging

## 🎯 Key Features Walkthrough

### 1. Trending System
- Movies become trending based on ticket sales volume
- Only top 5 movies appear in trending section
- Real-time updates with ranking badges (👑 Top 1, 🥈 Top 2, etc.)
- "Selling Fast" badges for trending movies

### 2. Spike Testing
- **Home Page**: "🔥 Spike Movie" button to quickly test any movie
- **Test Dashboard**: Individual spike buttons for each movie
- Each spike adds 25 ticket sales and updates trending rankings
- Real-time feedback showing current sales numbers

### 3. Notification System
- **Profile Settings**: Toggle notification preferences
- **Queue System**: Join notification queues for sold-out movies
- **Admin Tools**: Create new screenings and notify waiting users
- **Real-time Alerts**: Instant notifications for trending movies

### 4. Showtime Management
- Visual indicators for sold-out shows (red background, strikethrough)
- "Notify me" buttons for fully booked movies
- Dynamic new showtime integration with "NEW" badges
- Multi-step screening creation (Hall → Time → Type)

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Start with cache cleared
npx expo start --clear

# Run on specific platform
npx expo start --android
npx expo start --ios

# Build for production
expo build:android
expo build:ios
```

### Key Components

- **AppStateService**: Central state management for trending movies, ticket sales, and notification queues
- **NotificationService**: Handles local and push notifications with Firebase integration
- **FirebaseService**: Manages Firebase operations and spike detection
- **UserService**: User authentication and profile management

## 📋 Testing

### Spike Testing Workflow
1. Go to Home page → tap "🔥 Spike Movie"
2. Select any movie from the list
3. Watch the trending section update in real-time
4. Check ticket sales numbers in parentheses

### Notification Testing Workflow
1. Go to Showtimes → find sold-out movie (red background)
2. Tap "Notify me if new Screening opened"
3. Go to Test Dashboard → see movie in notification queue
4. Tap "Open New Screening" → create new showtime
5. Check for notification and new showtime with "NEW" badge

## 📈 Current Status

✅ **Completed Features:**
- Trending movies system with top 5 ranking
- Spike simulation from home page and test dashboard
- Notification queue system for sold-out movies
- Dynamic showtime creation and management
- User profile with notification preferences
- Real-time state management across all screens

🚧 **Future Enhancements:**
- Real user authentication
- Payment integration
- Seat selection interface
- Movie trailers and detailed info
- Advanced analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

---

**Made with ❤️ using React Native and Expo**
