# LFS Cinema App - Firebase Integration Guide

This React Native (Expo) cinema application features comprehensive Firebase integration for real-time notifications, booking spike detection, and user interest management.

## 🚀 Features Implemented

### ✅ Core Firebase Features
- **Real-time Database**: User interests, booking data, spike events
- **Cloud Functions**: Automated spike detection and notifications
- **Push Notifications**: FCM integration with topic subscriptions
- **User Management**: Session handling and preference storage

### ✅ Spike Detection System
- **Algorithm**: 20+ bookings in 5-minute window triggers urgency notifications
- **Cooldown**: 30-minute cooldown between notifications for same movie
- **Rate Limiting**: Max 3 notifications per movie per hour
- **Auto-detection**: Triggers on each new booking via Cloud Functions

### ✅ Notification System
- **Urgency Alerts**: "Movie selling fast" notifications
- **Topic Subscriptions**: Per-movie notification topics
- **Preference Management**: User-configurable notification settings
- **Foreground/Background**: Handles notifications in all app states

### ✅ User Experience
- **NotifyButton**: Subscribe/unsubscribe from movie alerts
- **HotBadge**: Visual indicator for fast-selling movies
- **Booking Integration**: Real booking data feeds spike detection
- **Test Dashboard**: Complete testing interface for all features

## 📁 Project Structure

```
cinemaLfsv2/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home screen with featured movies
│   │   ├── movies.tsx         # Movie grid with NotifyButton
│   │   ├── showtimes.tsx      # Booking interface
│   │   ├── profile.tsx        # User preferences
│   │   └── test.tsx           # Firebase test dashboard
│   └── _layout.tsx            # Service initialization
├── components/
│   ├── NotifyButton.tsx       # Firebase-integrated notification toggle
│   └── HotBadge.tsx          # "Selling Fast" indicator
├── services/
│   ├── FirebaseService.ts     # Core Firebase operations
│   ├── NotificationService.ts # FCM and topic management
│   └── UserService.ts         # User session management
├── firebase/
│   └── functions/
│       └── index.js           # Cloud Functions (Node.js)
└── firebase.config.ts         # Firebase configuration
```

## 🔧 Setup Instructions

### 1. Firebase Project Setup
```bash
# 1. Create Firebase project at https://console.firebase.google.com
# 2. Enable Realtime Database
# 3. Enable Cloud Functions
# 4. Enable Cloud Messaging (FCM)
# 5. Add Android/iOS apps to project
```

### 2. Install Dependencies
```bash
cd cinemaLfsv2
npm install

# Core Firebase packages (already included)
npm install @react-native-firebase/app
npm install @react-native-firebase/database
npm install @react-native-firebase/messaging
npm install @react-native-firebase/functions

# Additional dependencies
npm install @react-native-async-storage/async-storage
```

### 3. Configure Firebase
```typescript
// Update firebase.config.ts with your project details
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abcdef"
};
```

### 4. Deploy Cloud Functions
```bash
cd firebase/functions
npm install
firebase deploy --only functions
```

### 5. Database Structure
```json
{
  "interested_users": {
    "movieId": {
      "userId": {
        "timestamp": 1234567890,
        "notificationEnabled": true,
        "fcmToken": "token_here"
      }
    }
  },
  "bookings": {
    "showtimeId": {
      "bookingId": {
        "movieId": "1",
        "userId": "user_123",
        "timestamp": 1234567890,
        "seatCount": 2
      }
    }
  },
  "spike_events": {
    "eventId": {
      "movieId": "1",
      "showtimeId": "1_7:15 PM_Hall 3",
      "bookingCount": 25,
      "timestamp": 1234567890,
      "notificationSent": true
    }
  },
  "notification_history": {
    "movieId": {
      "notificationId": {
        "timestamp": 1234567890,
        "type": "spike_urgency"
      }
    }
  }
}
```

## 🔥 Spike Detection Algorithm

### Core Logic
```javascript
// Cloud Function: checkBookingSpike
const SPIKE_THRESHOLD = 20;        // bookings in time window
const TIME_WINDOW_MINUTES = 5;     // time window in minutes
const COOLDOWN_MINUTES = 30;       // cooldown between notifications
const MAX_NOTIFICATIONS_PER_HOUR = 3; // rate limiting

// 1. Count bookings in last 5 minutes
// 2. If count >= 20, check cooldown
// 3. If cooldown passed, send notifications
// 4. Update notification history
```

### Automatic Triggers
- **Database Trigger**: `onBookingAdded` - fires on each new booking
- **Manual Trigger**: `checkBookingSpike` - callable function
- **Scheduled Cleanup**: Daily cleanup of old booking data

## 📱 Notification Flow

### 1. User Interest Registration
```typescript
// User clicks "Notify Me" button
await firebaseService.storeUserInterest({
  userId: "user_123",
  movieId: "1",
  timestamp: Date.now(),
  notificationEnabled: true
});

// Subscribe to FCM topic
await messaging().subscribeToTopic(`urgency_movie_1`);
```

### 2. Booking & Spike Detection
```typescript
// User books tickets
await firebaseService.recordBooking({
  showtimeId: "1_7:15 PM_Hall 3",
  movieId: "1",
  userId: "user_123",
  timestamp: Date.now(),
  seatCount: 2
});

// Cloud Function automatically checks for spike
// If 20+ bookings in 5 minutes -> send notifications
```

### 3. Notification Delivery
```typescript
// Cloud Function sends FCM message
const message = {
  notification: {
    title: "🔥 Hurry! Movie Selling Fast!",
    body: "Guardians of the Galaxy Vol. 3 is selling out quickly!"
  },
  data: {
    type: "urgency",
    movieId: "1",
    urgencyLevel: "high"
  },
  topic: "urgency_movie_1"
};
```

## 🧪 Testing Features

### Test Dashboard (`/test` tab)
- **Permission Check**: Verify FCM permissions
- **Test Notifications**: Send sample notifications
- **Spike Simulation**: Create 25 bookings to trigger spike
- **User Info**: Display current user session

### Manual Testing Steps
1. Go to **Movies** tab
2. Click "Notify Me" on any movie
3. Go to **Test** tab
4. Run spike simulation for that movie
5. Receive urgency notification!

## 🔒 Security & Production Notes

### Firebase Security Rules (implement these)
```javascript
// Realtime Database Rules
{
  "rules": {
    "interested_users": {
      "$movieId": {
        "$userId": {
          ".write": "$userId === auth.uid",
          ".read": "$userId === auth.uid"
        }
      }
    },
    "bookings": {
      ".write": "auth != null",
      ".read": "auth != null"
    }
  }
}
```

### Production Checklist
- [ ] Add user authentication (Firebase Auth)
- [ ] Implement proper security rules
- [ ] Add error handling and retry logic
- [ ] Set up monitoring and analytics
- [ ] Configure app signing for FCM
- [ ] Test on physical devices
- [ ] Set up CI/CD for Cloud Functions

## 🚀 Running the App

```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios
```

## 📊 Monitoring & Analytics

### Firebase Console Monitoring
- **Realtime Database**: Monitor user interests and bookings
- **Cloud Functions**: Check function execution logs
- **Cloud Messaging**: Track notification delivery rates
- **Analytics**: User engagement with notifications

### Key Metrics to Track
- Notification opt-in rate
- Spike detection accuracy
- Notification open rates
- Booking conversion after notifications

## 🔧 Troubleshooting

### Common Issues

**Notifications not working:**
- Check FCM token generation
- Verify topic subscriptions
- Ensure proper app configuration files
- Test on physical device (not simulator)

**Spike detection not triggering:**
- Check Cloud Function logs
- Verify database trigger setup
- Ensure booking data structure matches expected format

**Database permission errors:**
- Update Firebase security rules
- Verify user authentication status

### Debug Commands
```bash
# Check Firebase connection
npx react-native info

# View Cloud Function logs
firebase functions:log --only checkBookingSpike

# Test FCM from console
# Use Firebase Console > Cloud Messaging > Send test message
```

## 🎯 Future Enhancements

- [ ] Machine learning for better spike prediction
- [ ] Personalized notification timing
- [ ] Advanced user segmentation
- [ ] A/B testing for notification content
- [ ] Integration with cinema seat maps
- [ ] Social features (share movie interests)
- [ ] Advanced analytics dashboard

---

**Ready to test?** Head to the Test tab in the app and try the spike simulation! 🔥
