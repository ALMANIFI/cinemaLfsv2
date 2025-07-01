import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AppStateService from '@/services/AppStateService';
import FirebaseService from '@/services/FirebaseService';
import NotificationService from '@/services/NotificationService';
import UserService from '@/services/UserService';

export default function TestScreen() {
  const [isLoading, setIsLoading] = useState(false);
  
  const firebaseService = FirebaseService.getInstance();
  const notificationService = NotificationService.getInstance();
  const userService = UserService.getInstance();
  const appStateService = AppStateService.getInstance();

  const simulateBookingSpike = async (movieId: string, movieTitle: string) => {
    setIsLoading(true);
    
    try {
      // Ensure UserService is initialized (will create demo user if none exists)
      await userService.initialize();
      
      const currentUser = userService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'Failed to initialize user for testing');
        return;
      }

      console.log(`Starting spike simulation for ${movieTitle} (ID: ${movieId})`);
      console.log('Current user:', currentUser.name);
      
      const showtimeId = `${movieId}_test_showtime_${Date.now()}`;
      const bookingPromises = [];

      // Simulate 25 bookings within 5 minutes (above spike threshold of 20)
      for (let i = 0; i < 25; i++) {
        const bookingData = {
          showtimeId: showtimeId,
          movieId: movieId,
          userId: `test_user_${i}_${Date.now()}`,
          timestamp: Date.now() - (Math.random() * 5 * 60 * 1000), // Random time within last 5 minutes
          seatCount: Math.floor(Math.random() * 4) + 1, // 1-4 seats
        };
        
        bookingPromises.push(firebaseService.recordBooking(bookingData));
      }

      console.log('Recording 25 fake bookings to Firebase...');
      await Promise.all(bookingPromises);
      console.log('All bookings recorded successfully');
      
      // Add 25 tickets to the movie's sales count and make it trending
      console.log(`Adding 25 tickets to movie ${movieId} (${movieTitle})`);
      appStateService.addTicketSales(movieId, 25);
      console.log('Movie sales updated in AppStateService');
      
      // Get current ticket sales for display
      const totalSales = appStateService.getTicketSales(movieId);
      
      Alert.alert(
        'Spike Simulation Complete! 🔥',
        `${movieTitle} now has ${totalSales} total tickets sold!\n\nCheck the homepage Trending Now section - movies are sorted by ticket sales!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Optionally trigger manual spike detection
              console.log('Triggering manual spike detection...');
              firebaseService.detectSpike(showtimeId, movieId, 20);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error simulating booking spike:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `Failed to simulate booking spike: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await notificationService.sendLocalNotification({
        title: '🔥 Test Notification',
        body: 'This is a test notification to verify the notification system is working!',
        type: 'urgency',
        movieId: '1',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const openNewScreening = async (movieId: string, movieTitle: string, userCount: number) => {
    try {
      // Show screening creation form
      Alert.alert(
        'Create New Screening',
        `Create a new screening for "${movieTitle}"`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Create Screening',
            onPress: () => showScreeningForm(movieId, movieTitle, userCount),
          },
        ]
      );
    } catch (error) {
      console.error('Error opening new screening:', error);
      Alert.alert('Error', 'Failed to open new screening form.');
    }
  };

  const showScreeningForm = (movieId: string, movieTitle: string, userCount: number) => {
    // Available options
    const halls = ['Hall 1', 'Hall 2', 'Hall 3'];
    const types = ['2D', '3D', 'IMAX'];
    const times = [
      '9:00 AM', '10:30 AM', '12:00 PM', '1:45 PM', '3:00 PM', 
      '4:30 PM', '6:00 PM', '7:15 PM', '8:30 PM', '10:00 PM'
    ];

    // Show hall selection first
    Alert.alert(
      'Select Hall',
      'Choose a hall for the new screening:',
      halls.map(hall => ({
        text: hall,
        onPress: () => showTimeSelection(movieId, movieTitle, userCount, hall, types, times),
      })).concat([
        {
          text: 'Cancel',
          onPress: () => {},
        },
      ])
    );
  };

  const showTimeSelection = (movieId: string, movieTitle: string, userCount: number, hall: string, types: string[], times: string[]) => {
    Alert.alert(
      'Select Time',
      `Hall: ${hall}\nChoose a time for the new screening:`,
      times.map(time => ({
        text: time,
        onPress: () => showTypeSelection(movieId, movieTitle, userCount, hall, time, types),
      })).concat([
        {
          text: 'Back',
          onPress: () => showScreeningForm(movieId, movieTitle, userCount),
        },
        {
          text: 'Cancel',
          onPress: () => {},
        },
      ])
    );
  };

  const showTypeSelection = (movieId: string, movieTitle: string, userCount: number, hall: string, time: string, types: string[]) => {
    Alert.alert(
      'Select Type',
      `Hall: ${hall}\nTime: ${time}\nChoose screening type:`,
      types.map(type => ({
        text: type,
        onPress: () => createScreening(movieId, movieTitle, userCount, hall, time, type),
      })).concat([
        {
          text: 'Back',
          onPress: async () => showTimeSelection(movieId, movieTitle, userCount, hall, types, [time]),
        },
        {
          text: 'Cancel',
          onPress: async () => {},
        },
      ])
    );
  };

  const createScreening = async (movieId: string, movieTitle: string, userCount: number, hall: string, time: string, type: string) => {
    try {
      // Create the new showtime
      appStateService.addNewShowtime(movieId, { time, hall, type });
      
      // Get users in the notification queue
      const usersToNotify = appStateService.clearNotificationQueue(movieId);
      
      // Send notifications to users
      for (const userId of usersToNotify) {
        try {
          await notificationService.sendLocalNotification({
            title: '🎬 New Screening Available!',
            body: `New screening for "${movieTitle}" at ${time} in ${hall} (${type}) is now open for booking!`,
            type: 'reminder',
            movieId: movieId,
          });
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
        }
      }
      
      Alert.alert(
        'Screening Created! 🎬',
        `New screening created successfully!\n\n📽️ Movie: ${movieTitle}\n🏢 Hall: ${hall}\n⏰ Time: ${time}\n🎭 Type: ${type}\n\n✅ Notified ${usersToNotify.length} user${usersToNotify.length !== 1 ? 's' : ''}\n\nGo to Showtimes tab to see the new screening!`,
        [
          {
            text: 'OK',
          },
        ]
      );
      
    } catch (error) {
      console.error('Error creating screening:', error);
      Alert.alert('Error', 'Failed to create new screening.');
    }
  };

  const checkNotificationPermissions = async () => {
    try {
      const status = await notificationService.getPermissionStatus();
      const token = await notificationService.getToken();
      
      Alert.alert(
        'Notification Status',
        `Permission: ${status}\nFCM Token: ${token ? 'Available' : 'Not available'}`,
        [
          {
            text: 'Request Permission',
            onPress: async () => {
              const granted = await notificationService.requestPermission();
              Alert.alert(
                'Permission Result',
                granted ? 'Permission granted!' : 'Permission denied'
              );
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const testMovies = [
    // Movies from ALL_MOVIES (Trending Now pool)
    { id: '1', title: 'Guardians of the Galaxy Vol. 3' },
    { id: '2', title: 'Fast X' },
    { id: '3', title: 'The Little Mermaid' },
    // Movies from NOW_SHOWING
    { id: '4', title: 'John Wick: Chapter 4' },
    { id: '5', title: 'Scream VI' },
    { id: '6', title: 'Ant-Man and the Wasp: Quantumania' },
    { id: '7', title: 'Spider-Man: Across the Spider-Verse' },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          🔥 Movie Spike Test Dashboard
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Simulate booking spikes to create trending movies
        </ThemedText>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Current User</ThemedText>
          <View style={styles.userCard}>
            <ThemedText style={styles.userName}>
              {userService.getCurrentUser()?.name || 'Not authenticated'}
            </ThemedText>
            <ThemedText style={styles.userId}>
              ID: {userService.getCurrentUser()?.id || 'N/A'}
            </ThemedText>
          </View>
        </View>

        {/* Notification Tests */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notification Tests</ThemedText>
          
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={checkNotificationPermissions}
          >
            <IconSymbol name="bell.fill" size={20} color="white" />
            <ThemedText style={styles.buttonText}>
              Check Permissions
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testButton} 
            onPress={sendTestNotification}
          >
            <IconSymbol name="paperplane.fill" size={20} color="white" />
            <ThemedText style={styles.buttonText}>
              Send Test Notification
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Spike Detection Tests */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>🔥 Ticket Sales & Top 5 Trending</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Spike adds 25 tickets per test - only TOP 5 movies get trending status!
          </ThemedText>
          
          {testMovies.map((movie) => (
            <TouchableOpacity 
              key={movie.id}
              style={[styles.spikeButton, isLoading && styles.buttonDisabled]} 
              onPress={() => simulateBookingSpike(movie.id, movie.title)}
              disabled={isLoading}
            >
              <IconSymbol name="chart.bar.fill" size={20} color="white" />
              <ThemedText style={styles.buttonText}>
                {isLoading ? 'Adding Tickets...' : `Spike: ${movie.title} (${appStateService.getTicketSales(movie.id)} sold)`}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification Queue Management */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>📺 New Screening Notifications</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Open new screenings for movies with notification queues
          </ThemedText>
          
          {(() => {
            const moviesWithQueues = appStateService.getMoviesWithNotificationQueues();
            
            if (moviesWithQueues.length === 0) {
              return (
                <View style={styles.emptyCard}>
                  <ThemedText style={styles.emptyText}>
                    No users waiting for notifications.{'\n'}
                    Go to Showtimes tab and tap &quot;Notify me if new Screening opened&quot; for sold-out movies!
                  </ThemedText>
                </View>
              );
            }
            
            return moviesWithQueues.map(({ movieId, userCount }) => {
              const movie = testMovies.find(m => m.id === movieId);
              const movieTitle = movie?.title || `Movie ${movieId}`;
              
              return (
                <TouchableOpacity 
                  key={movieId}
                  style={styles.notificationButton}
                  onPress={() => openNewScreening(movieId, movieTitle, userCount)}
                >
                  <IconSymbol name="tv.fill" size={20} color="white" />
                  <ThemedText style={styles.buttonText}>
                    Open New Screening: {movieTitle} ({userCount} waiting)
                  </ThemedText>
                </TouchableOpacity>
              );
            });
          })()}
        </View>


      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    opacity: 0.7,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  spikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 12,
    fontSize: 16,
  },
  instructionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
});
