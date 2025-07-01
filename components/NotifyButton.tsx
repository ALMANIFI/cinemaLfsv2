import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import FirebaseService from '@/services/FirebaseService';
import NotificationService from '@/services/NotificationService';
import UserService from '@/services/UserService';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

interface NotifyButtonProps {
  movieId: string;
  movieTitle: string;
  initialInterested?: boolean;
  size?: 'small' | 'medium' | 'large';
  onToggle?: (movieId: string, isInterested: boolean) => void;
}

export default function NotifyButton({ 
  movieId, 
  movieTitle, 
  initialInterested = false,
  size = 'medium',
  onToggle 
}: NotifyButtonProps) {
  const colorScheme = useColorScheme();
  const [isInterested, setIsInterested] = useState(initialInterested);
  const [isLoading, setIsLoading] = useState(false);
  
  const firebaseService = FirebaseService.getInstance();
  const notificationService = NotificationService.getInstance();
  const userService = UserService.getInstance();

  useEffect(() => {
    // Initialize notification service and load user's existing interest
    const initializeNotifications = async () => {
      await notificationService.initialize();
    };
    
    initializeNotifications();
    // For now, we'll use the initialInterested prop
    // In a real app, you'd fetch this from Firebase based on user ID
  }, [movieId, notificationService]);

  const handleToggle = async () => {
    if (isLoading) return;
    
    const currentUser = userService.getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    setIsLoading(true);
    const newState = !isInterested;
    
    try {
      if (newState) {
        // Store user interest in Firebase
        const userInterest = {
          userId: currentUser.id,
          movieId: movieId,
          timestamp: Date.now(),
          notificationEnabled: true,
        };
        
        const success = await firebaseService.storeUserInterest(userInterest);
        if (success) {
          // Subscribe to topic notifications for this movie
          await notificationService.subscribeToMovieNotifications(movieId);
          
          // Send a test notification to confirm it's working
          await notificationService.sendLocalNotification({
            title: 'Notifications Enabled! 🔔',
            body: `You'll now receive alerts when "${movieTitle}" tickets are selling fast!`,
            movieId: movieId,
            type: 'reminder'
          });
          
          setIsInterested(true);
          
          Alert.alert(
            'Notifications Enabled',
            `You'll be notified when "${movieTitle}" is selling fast!`
          );
        } else {
          throw new Error('Failed to store user interest');
        }
      } else {
        // Remove user interest from Firebase
        const success = await firebaseService.removeUserInterest(movieId, currentUser.id);
        
        if (success) {
          // Unsubscribe from topic notifications for this movie
          await notificationService.unsubscribeFromMovieNotifications(movieId);
          
          // Send a confirmation notification
          await notificationService.sendLocalNotification({
            title: 'Notifications Disabled 🔕',
            body: `You'll no longer receive alerts for "${movieTitle}"`,
            movieId: movieId,
            type: 'reminder'
          });
          
          setIsInterested(false);
          
          Alert.alert(
            'Notifications Disabled',
            `Notifications disabled for "${movieTitle}"`
          );
        } else {
          throw new Error('Failed to remove user interest');
        }
      }
      
      if (onToggle) {
        onToggle(movieId, newState);
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      Alert.alert(
        'Error',
        'Failed to update notification preferences. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        isInterested ? styles.buttonActive : styles.buttonInactive,
        size === 'small' ? styles.buttonSmall : 
        size === 'large' ? styles.buttonLarge : styles.buttonMedium,
        isLoading && styles.buttonDisabled
      ]} 
      onPress={handleToggle}
      disabled={isLoading}
    >
      <IconSymbol 
        name={isLoading ? "clock" : isInterested ? "checkmark.circle.fill" : "bell"} 
        size={size === 'small' ? 14 : size === 'large' ? 20 : 16} 
        color={isInterested ? 'white' : Colors[colorScheme ?? 'light'].tint} 
      />
      <ThemedText 
        style={[
          styles.text,
          isInterested ? styles.textActive : styles.textInactive,
          size === 'small' ? styles.textSmall : 
          size === 'large' ? styles.textLarge : styles.textMedium
        ]}
      >
        {isLoading ? 'Loading...' : isInterested ? 'Notifying' : 'Notify Me'}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonInactive: {
    backgroundColor: 'transparent',
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    marginLeft: 4,
    fontWeight: '500',
  },
  textActive: {
    color: 'white',
  },
  textInactive: {
    color: '#007AFF',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
});
