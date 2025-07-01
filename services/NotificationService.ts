import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import FirebaseService from './FirebaseService';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  movieId?: string;
  type: 'urgency' | 'reminder' | 'promotion' | 'new_movie';
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private firebaseService: FirebaseService;
  private expoPushToken: string | null = null;

  private constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.setupNotificationListeners();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Register for push notifications and get Expo push token
  async registerForPushNotifications(): Promise<string | null> {
    let token = null;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return null;
      }

      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('📱 Expo Push Token:', token);
        this.expoPushToken = token;
      } catch (e) {
        console.error('Error getting push token:', e);
        token = null;
      }
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  // Setup notification listeners
  private setupNotificationListeners() {
    // Handle notifications when app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification tapped:', response);
      const { movieId } = response.notification.request.content.data || {};
      if (movieId) {
        console.log(`Navigate to movie: ${movieId}`);
      }
    });
  }

  // Send local notification (works immediately)
  async sendLocalNotification(data: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: { movieId: data.movieId, type: data.type, ...data.data },
          sound: true,
        },
        trigger: null, // Send immediately
      });
      console.log('📱 Local notification sent:', data.title);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Send push notification via Expo Push API
  async sendPushNotification(to: string, data: NotificationData): Promise<void> {
    try {
      const message = {
        to,
        sound: 'default',
        title: data.title,
        body: data.body,
        data: { movieId: data.movieId, type: data.type, ...data.data },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('📤 Push notification sent:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Get current permission status
  async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  // Request notification permissions
  async requestPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // Get Expo push token
  async getToken(): Promise<string | null> {
    if (!this.expoPushToken) {
      this.expoPushToken = await this.registerForPushNotifications();
    }
    return this.expoPushToken;
  }

  // Subscribe to movie notifications
  async subscribeToMovieNotifications(movieId: string): Promise<void> {
    console.log(`🔔 Subscribed to notifications for movie: ${movieId}`);
  }

  // Unsubscribe from movie notifications
  async unsubscribeFromMovieNotifications(movieId: string): Promise<void> {
    console.log(`🔕 Unsubscribed from notifications for movie: ${movieId}`);
  }

  // Send urgency notification for booking spike
  async sendUrgencyNotification(movieTitle: string, movieId: string): Promise<void> {
    const notificationData: NotificationData = {
      title: `🔥 ${movieTitle} is selling fast!`,
      body: `Hurry! ${movieTitle} tickets are being booked rapidly. Get yours now before they sell out!`,
      movieId,
      type: 'urgency',
      data: {
        action: 'view_showtimes',
        priority: 'high'
      }
    };

    await this.sendLocalNotification(notificationData);
    if (this.expoPushToken) {
      await this.sendPushNotification(this.expoPushToken, notificationData);
    }
  }

  // Send reminder notification
  async sendReminderNotification(movieTitle: string, movieId: string): Promise<void> {
    const notificationData: NotificationData = {
      title: `📅 Reminder: ${movieTitle}`,
      body: `Don't forget! ${movieTitle} is showing soon. Book your tickets now!`,
      movieId,
      type: 'reminder'
    };

    await this.sendLocalNotification(notificationData);
  }

  // Initialize notification service
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Real Notification Service...');
    await this.registerForPushNotifications();
  }
}

export default NotificationService;
