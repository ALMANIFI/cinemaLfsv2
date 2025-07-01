// For Expo, we'll use a mock implementation until you eject or use EAS Build
// This allows the app to run in development mode

// Mock Firebase implementation for Expo compatibility
const mockDatabase = {
  ref: (path: string) => ({
    set: async (data: any) => {
      console.log(`Mock Firebase: Setting data at ${path}:`, data);
      return Promise.resolve();
    },
    push: () => ({
      set: async (data: any) => {
        console.log(`Mock Firebase: Pushing data at ${path}:`, data);
        return Promise.resolve();
      }
    }),
    remove: async () => {
      console.log(`Mock Firebase: Removing data at ${path}`);
      return Promise.resolve();
    },
    once: async (eventType: string) => {
      console.log(`Mock Firebase: Reading data at ${path}`);
      return Promise.resolve({
        val: () => null
      });
    },
    orderByChild: (child: string) => ({
      startAt: (value: any) => ({
        once: async (eventType: string) => {
          console.log(`Mock Firebase: Querying ${path} where ${child} >= ${value}`);
          return Promise.resolve({
            val: () => null
          });
        }
      })
    })
  })
};

const mockFunctions = {
  httpsCallable: (name: string) => async (data: any) => {
    console.log(`Mock Firebase Function: ${name}`, data);
    return Promise.resolve({
      data: {
        spikeDetected: Math.random() > 0.5,
        bookingCount: Math.floor(Math.random() * 30),
        threshold: 20,
        timeWindow: 5
      }
    });
  }
};

const mockMessaging = {
  requestPermission: async () => {
    console.log('Mock Firebase: Requesting notification permission');
    return Promise.resolve(1); // AUTHORIZED
  },
  getToken: async () => {
    console.log('Mock Firebase: Getting FCM token');
    return Promise.resolve('mock_fcm_token_' + Date.now());
  },
  subscribeToTopic: async (topic: string) => {
    console.log(`Mock Firebase: Subscribing to topic ${topic}`);
    return Promise.resolve();
  },
  unsubscribeFromTopic: async (topic: string) => {
    console.log(`Mock Firebase: Unsubscribing from topic ${topic}`);
    return Promise.resolve();
  },
  onMessage: (handler: any) => {
    console.log('Mock Firebase: Setting up foreground message handler');
    // For demo, trigger a mock notification after 10 seconds
    setTimeout(() => {
      handler({
        notification: {
          title: 'Mock Notification',
          body: 'This is a test notification from mock Firebase'
        },
        data: {
          type: 'test',
          movieId: '1'
        }
      });
    }, 10000);
    return () => {}; // unsubscribe function
  },
  setBackgroundMessageHandler: (handler: any) => {
    console.log('Mock Firebase: Setting up background message handler');
  },
  onNotificationOpenedApp: (handler: any) => {
    console.log('Mock Firebase: Setting up notification opened handler');
  },
  getInitialNotification: async () => {
    console.log('Mock Firebase: Getting initial notification');
    return Promise.resolve(null);
  }
};

// Firebase Database References
const INTERESTED_USERS_REF = 'interested_users';
const BOOKINGS_REF = 'bookings';

export interface UserInterest {
  userId: string;
  movieId: string;
  timestamp: number;
  notificationEnabled: boolean;
}

export interface BookingData {
  showtimeId: string;
  movieId: string;
  userId: string;
  timestamp: number;
  seatCount: number;
}

export interface SpikeThreshold {
  movieId: string;
  bookingsCount: number;
  timeWindow: number; // in minutes
  isActive: boolean;
}

class FirebaseService {
  private static instance: FirebaseService;
  private fcmToken: string | null = null;
  private database = mockDatabase;
  private functions = mockFunctions;
  private messaging = mockMessaging;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Initialize Firebase and request permissions
  async initialize(): Promise<void> {
    try {
      // Request permission for notifications
      const authStatus = await this.messaging.requestPermission();
      const enabled = authStatus === 1; // AUTHORIZED

      if (enabled) {
        console.log('Notification permission granted');
        await this.getFCMToken();
      } else {
        console.log('Notification permission denied');
      }

      // Set up foreground message handler
      this.setupForegroundMessageHandler();
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  }

  // Get FCM Token
  async getFCMToken(): Promise<string | null> {
    try {
      if (!this.fcmToken) {
        this.fcmToken = await this.messaging.getToken();
        console.log('FCM Token:', this.fcmToken);
      }
      return this.fcmToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Store user interest in a movie
  async storeUserInterest(interest: UserInterest): Promise<boolean> {
    try {
      const ref = this.database.ref(`${INTERESTED_USERS_REF}/${interest.movieId}/${interest.userId}`);
      await ref.set({
        timestamp: interest.timestamp,
        notificationEnabled: interest.notificationEnabled,
        fcmToken: this.fcmToken,
      });
      console.log('User interest stored successfully');
      return true;
    } catch (error) {
      console.error('Error storing user interest:', error);
      return false;
    }
  }

  // Remove user interest in a movie
  async removeUserInterest(movieId: string, userId: string): Promise<boolean> {
    try {
      const ref = this.database.ref(`${INTERESTED_USERS_REF}/${movieId}/${userId}`);
      await ref.remove();
      console.log('User interest removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing user interest:', error);
      return false;
    }
  }

  // Get all users interested in a movie
  async getInterestedUsers(movieId: string): Promise<any[]> {
    try {
      const snapshot = await this.database.ref(`${INTERESTED_USERS_REF}/${movieId}`).once('value');
      const data = snapshot.val();
      if (!data) return [];
      
      return Object.entries(data).map(([userId, userdata]) => ({ 
        userId, 
        ...(userdata as any) 
      }));
    } catch (error) {
      console.error('Error getting interested users:', error);
      return [];
    }
  }

  // Record a booking (for spike detection)
  async recordBooking(booking: BookingData): Promise<boolean> {
    try {
      const ref = this.database.ref(`${BOOKINGS_REF}/${booking.showtimeId}`).push();
      await ref.set({
        movieId: booking.movieId,
        userId: booking.userId,
        timestamp: booking.timestamp,
        seatCount: booking.seatCount,
      });
      console.log('Booking recorded successfully');

      // Trigger spike detection
      await this.checkForBookingSpike(booking.showtimeId, booking.movieId);
      return true;
    } catch (error) {
      console.error('Error recording booking:', error);
      return false;
    }
  }

  // Check for booking spike and trigger notifications
  private async checkForBookingSpike(showtimeId: string, movieId: string): Promise<void> {
    try {
      // Call Firebase Cloud Function for spike detection
      const checkSpike = this.functions.httpsCallable('checkBookingSpike');
      const result = await checkSpike({
        showtimeId,
        movieId,
        timestamp: Date.now(),
      });

      const resultData = result.data as any;
      if (resultData?.spikeDetected) {
        console.log('Booking spike detected!', resultData);
        // Cloud function will handle notifications
      }
    } catch (error) {
      console.error('Error checking booking spike:', error);
    }
  }

  // Set up foreground message handler
  private setupForegroundMessageHandler(): void {
    this.messaging.onMessage(async (remoteMessage: any) => {
      console.log('Foreground message received:', remoteMessage);
      // Handle foreground notification here
      // You can show a custom alert or update UI
    });
  }

  // Set up background message handler
  static setupBackgroundMessageHandler(): void {
    // Mock implementation
    console.log('Background message handler setup (mock)');
  }

  // Subscribe to movie notifications
  async subscribeToMovie(movieId: string): Promise<boolean> {
    try {
      await this.messaging.subscribeToTopic(`movie_${movieId}`);
      console.log(`Subscribed to movie ${movieId} notifications`);
      return true;
    } catch (error) {
      console.error('Error subscribing to movie notifications:', error);
      return false;
    }
  }

  // Unsubscribe from movie notifications
  async unsubscribeFromMovie(movieId: string): Promise<boolean> {
    try {
      await this.messaging.unsubscribeFromTopic(`movie_${movieId}`);
      console.log(`Unsubscribed from movie ${movieId} notifications`);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from movie notifications:', error);
      return false;
    }
  }

  // Get recent bookings for spike detection (local fallback)
  async getRecentBookings(showtimeId: string, minutes: number = 5): Promise<any[]> {
    try {
      const cutoffTime = Date.now() - (minutes * 60 * 1000);
      const snapshot = await this.database
        .ref(`${BOOKINGS_REF}/${showtimeId}`)
        .orderByChild('timestamp')
        .startAt(cutoffTime)
        .once('value');
      
      const data = snapshot.val();
      return data ? Object.values(data) : [];
    } catch (error) {
      console.error('Error getting recent bookings:', error);
      return [];
    }
  }

  // Manual spike detection (fallback if cloud function fails)
  async detectSpike(showtimeId: string, movieId: string, threshold: number = 20): Promise<boolean> {
    try {
      const recentBookings = await this.getRecentBookings(showtimeId, 5);
      const spikeDetected = recentBookings.length >= threshold;
      
      if (spikeDetected) {
        console.log(`Spike detected! ${recentBookings.length} bookings in last 5 minutes`);
        // Trigger notifications locally
        await this.triggerUrgencyNotifications(movieId);
      }
      
      return spikeDetected;
    } catch (error) {
      console.error('Error in manual spike detection:', error);
      return false;
    }
  }

  // Trigger urgency notifications for interested users
  private async triggerUrgencyNotifications(movieId: string): Promise<void> {
    try {
      const interestedUsers = await this.getInterestedUsers(movieId);
      
      if (interestedUsers.length === 0) {
        console.log('No interested users found for movie:', movieId);
        return;
      }

      // Call cloud function to send notifications
      const sendNotifications = this.functions.httpsCallable('sendUrgencyNotifications');
      await sendNotifications({
        movieId,
        userTokens: interestedUsers.map(user => user.fcmToken).filter(Boolean),
        message: `🔥 Hurry! Your movie is selling out quickly!`,
      });

      console.log(`Triggered urgency notifications for ${interestedUsers.length} users`);
    } catch (error) {
      console.error('Error triggering urgency notifications:', error);
    }
  }
}

export default FirebaseService;
