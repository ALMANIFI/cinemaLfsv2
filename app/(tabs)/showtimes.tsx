import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AppStateService from '@/services/AppStateService';
import FirebaseService from '@/services/FirebaseService';
import UserService from '@/services/UserService';

const CINEMA_LOCATIONS = ['LFS Cinema Pavilion KL', 'LFS Cinema Subang', 'LFS Cinema Setapak'];

const SHOWTIMES_DATA = [
  {
    id: '1',
    title: 'Guardians of the Galaxy Vol. 3',
    image: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    duration: '150 min',
    rating: 'PG-13',
    showtimes: [
      { time: '10:30 AM', hall: 'Hall 1', type: '2D', isFullyBooked: true }, // FULLY BOOKED
      { time: '1:45 PM', hall: 'Hall 2', type: 'IMAX', isFullyBooked: true }, // FULLY BOOKED
      { time: '4:30 PM', hall: 'Hall 1', type: '2D', isFullyBooked: true }, // FULLY BOOKED
      { time: '7:15 PM', hall: 'Hall 3', type: '3D', isFullyBooked: true }, // FULLY BOOKED
      { time: '10:00 PM', hall: 'Hall 2', type: 'IMAX', isFullyBooked: true }, // FULLY BOOKED
    ]
  },
  {
    id: '2',
    title: 'Fast X',
    image: 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
    duration: '141 min',
    rating: 'PG-13',
    showtimes: [
      { time: '11:00 AM', hall: 'Hall 3', type: '2D', isFullyBooked: false },
      { time: '2:15 PM', hall: 'Hall 1', type: '2D', isFullyBooked: false },
      { time: '5:00 PM', hall: 'Hall 3', type: '3D', isFullyBooked: false }, // Available
      { time: '8:30 PM', hall: 'Hall 1', type: '2D', isFullyBooked: false },
    ]
  },
  {
    id: '3',
    title: 'The Little Mermaid',
    image: 'https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg',
    duration: '135 min',
    rating: 'PG',
    showtimes: [
      { time: '9:30 AM', hall: 'Hall 2', type: '2D', isFullyBooked: false },
      { time: '12:00 PM', hall: 'Hall 2', type: '2D', isFullyBooked: true }, // FULLY BOOKED
      { time: '3:00 PM', hall: 'Hall 2', type: '2D', isFullyBooked: false },
      { time: '6:00 PM', hall: 'Hall 2', type: '2D', isFullyBooked: true }, // FULLY BOOKED #2
      { time: '9:00 PM', hall: 'Hall 3', type: '3D', isFullyBooked: false },
    ]
  }
];

export default function ShowtimesScreen() {
  const colorScheme = useColorScheme();
  const [selectedLocation, setSelectedLocation] = useState(CINEMA_LOCATIONS[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [notificationQueues, setNotificationQueues] = useState<{[movieId: string]: string[]}>({});
  const [newShowtimes, setNewShowtimes] = useState<{[movieId: string]: any[]}>({});
  
  const firebaseService = FirebaseService.getInstance();
  const userService = UserService.getInstance();
  const appStateService = AppStateService.getInstance();

  // Subscribe to notification queue changes
  useState(() => {
    const unsubscribeQueue = appStateService.subscribe('notificationQueue', () => {
      // Update local state with current queue data
      const queueData: {[movieId: string]: string[]} = {};
      SHOWTIMES_DATA.forEach(movie => {
        queueData[movie.id] = appStateService.getNotificationQueue(movie.id);
      });
      setNotificationQueues(queueData);
    });
    
    const unsubscribeShowtimes = appStateService.subscribe('newShowtimes', () => {
      // Update local state with new showtimes
      const newShowtimesData = appStateService.getAllNewShowtimes();
      setNewShowtimes(newShowtimesData);
    });
    
    // Initial load
    const initialQueueData: {[movieId: string]: string[]} = {};
    const initialShowtimesData = appStateService.getAllNewShowtimes();
    SHOWTIMES_DATA.forEach(movie => {
      initialQueueData[movie.id] = appStateService.getNotificationQueue(movie.id);
    });
    setNotificationQueues(initialQueueData);
    setNewShowtimes(initialShowtimesData);
    
    return () => {
      unsubscribeQueue();
      unsubscribeShowtimes();
    };
  });

  // Handle notification signup for sold-out showtimes
  const handleNotifyMe = (movie: typeof SHOWTIMES_DATA[0], showtime: any) => {
    const currentUser = userService.getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const isAlreadyInQueue = appStateService.isUserInNotificationQueue(movie.id, currentUser.id);
    
    if (isAlreadyInQueue) {
      Alert.alert(
        'Already Notified',
        `You're already signed up to be notified when new screenings for "${movie.title}" are opened.`,
        [
          {
            text: 'Remove Me',
            style: 'destructive',
            onPress: () => {
              appStateService.removeFromNotificationQueue(movie.id, currentUser.id);
              Alert.alert('Removed', 'You will no longer be notified about new screenings for this movie.');
            },
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Get Notified',
      `Would you like to be notified when new screenings for "${movie.title}" are opened?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Notify Me',
          onPress: () => {
            appStateService.addToNotificationQueue(movie.id, currentUser.id);
            Alert.alert(
              'Notification Set!',
              `You'll be notified when new screenings for "${movie.title}" are opened. Check the Test Dashboard to simulate opening new screenings.`
            );
          },
        },
      ]
    );
  };

  // Handle showtime booking
  const handleBookShowtime = async (movie: typeof SHOWTIMES_DATA[0], showtime: any) => {
    const currentUser = userService.getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    const showtimeId = `${movie.id}_${showtime.time}_${showtime.hall}`;
    
    if (bookingLoading === showtimeId) return;
    
    setBookingLoading(showtimeId);
    
    try {
      // Simulate booking confirmation
      Alert.alert(
        'Book Tickets',
        `Book tickets for "${movie.title}" at ${showtime.time}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setBookingLoading(null),
          },
          {
            text: 'Book Now',
            onPress: async () => {
              try {
                // Record booking in Firebase
                const bookingData = {
                  showtimeId: showtimeId,
                  movieId: movie.id,
                  userId: currentUser.id,
                  timestamp: Date.now(),
                  seatCount: 2, // Demo: 2 seats
                };
                
                const success = await firebaseService.recordBooking(bookingData);
                
                if (success) {
                  Alert.alert(
                    'Booking Confirmed!',
                    `Your tickets for "${movie.title}" at ${showtime.time} have been recorded. This helps us monitor demand and notify interested users when shows are selling fast!`
                  );
                } else {
                  throw new Error('Failed to record booking');
                }
              } catch (error) {
                console.error('Booking error:', error);
                Alert.alert(
                  'Booking Error',
                  'Failed to complete booking. Please try again.'
                );
              } finally {
                setBookingLoading(null);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing booking dialog:', error);
      setBookingLoading(null);
    }
  };

  // Generate next 7 days
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toDateString(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
      });
    }
    return days;
  };

  const days = getNext7Days();

  const ShowtimeCard = ({ movie }: { movie: typeof SHOWTIMES_DATA[0] }) => {
    const currentUser = userService.getCurrentUser();
    const movieQueue = notificationQueues[movie.id] || [];
    const isUserInQueue = currentUser ? movieQueue.includes(currentUser.id) : false;
    
    // Merge original showtimes with new ones
    const movieNewShowtimes = newShowtimes[movie.id] || [];
    const allShowtimes = [...movie.showtimes, ...movieNewShowtimes];
    
    return (
      <View style={styles.movieCard}>
        <View style={styles.movieHeader}>
          <Image
            source={{ uri: movie.image }}
            style={styles.moviePoster}
          />
          <View style={styles.movieInfo}>
            <ThemedText style={styles.movieTitle} numberOfLines={2}>
              {movie.title}
            </ThemedText>
            <View style={styles.movieDetails}>
              <ThemedText style={styles.movieMeta}>
                {movie.rating} • {movie.duration}
              </ThemedText>
              {movieQueue.length > 0 && (
                <ThemedText style={styles.queueInfo}>
                  {movieQueue.length} user{movieQueue.length !== 1 ? 's' : ''} waiting for new screenings
                </ThemedText>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.showtimesContainer}>
          {allShowtimes.map((showtime, index) => {
            const showtimeId = showtime.id || `${movie.id}_${showtime.time}_${showtime.hall}`;
            const isLoading = bookingLoading === showtimeId;
            const isFullyBooked = showtime.isFullyBooked;
            const isNewShowtime = showtime.id && showtime.id.startsWith('new_'); // Check if it's a new showtime
            
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.showtimeButton, 
                  isLoading && styles.showtimeButtonLoading,
                  isFullyBooked && styles.showtimeButtonFullyBooked,
                  isNewShowtime && styles.showtimeButtonNew
                ]}
                onPress={() => {
                  if (isFullyBooked) {
                    Alert.alert(
                      'Fully Booked',
                      `Sorry, the ${showtime.time} showtime for "${movie.title}" is fully booked. Please select another time.`
                    );
                  } else {
                    handleBookShowtime(movie, showtime);
                  }
                }}
                disabled={isLoading}
              >
                {isFullyBooked && (
                  <View style={styles.fullyBookedBadge}>
                    <ThemedText style={styles.fullyBookedText}>SOLD OUT</ThemedText>
                  </View>
                )}
                {isNewShowtime && (
                  <View style={styles.newShowtimeBadge}>
                    <ThemedText style={styles.newShowtimeText}>NEW</ThemedText>
                  </View>
                )}
                <ThemedText style={[
                  styles.showtimeTime,
                  isFullyBooked && styles.showtimeTimeDisabled
                ]}>
                  {isLoading ? 'Booking...' : showtime.time}
                </ThemedText>
                <ThemedText style={[
                  styles.showtimeDetails,
                  isFullyBooked && styles.showtimeDetailsDisabled
                ]}>
                  {showtime.hall} • {showtime.type}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Show notification button only if ALL showtimes are fully booked */}
        {allShowtimes.every(s => s.isFullyBooked) && (
          <View style={styles.notificationSection}>
            <TouchableOpacity
              style={[
                styles.notifyButton,
                isUserInQueue && styles.notifyButtonActive
              ]}
              onPress={() => handleNotifyMe(movie, null)}
            >
              <ThemedText style={[
                styles.notifyButtonText,
                isUserInQueue && styles.notifyButtonTextActive
              ]}>
                {isUserInQueue 
                  ? '✓ You\'ll be notified of new screenings' 
                  : 'Notify me if new Screening opened'
                }
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Showtimes
        </ThemedText>
      </View>

      {/* Location Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.locationContainer}
        contentContainerStyle={styles.locationContent}
      >
        {CINEMA_LOCATIONS.map((location) => (
          <TouchableOpacity
            key={location}
            style={[
              styles.locationButton,
              selectedLocation === location && {
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
              }
            ]}
            onPress={() => setSelectedLocation(location)}
          >
            <ThemedText
              style={[
                styles.locationText,
                selectedLocation === location && styles.locationTextActive
              ]}
            >
              {location}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dateContainer}
        contentContainerStyle={styles.dateContent}
      >
        {days.map((day) => (
          <TouchableOpacity
            key={day.date}
            style={[
              styles.dateButton,
              selectedDate === day.date && {
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
              }
            ]}
            onPress={() => setSelectedDate(day.date)}
          >
            <ThemedText
              style={[
                styles.dayText,
                selectedDate === day.date && styles.dayTextActive
              ]}
            >
              {day.day}
            </ThemedText>
            <ThemedText
              style={[
                styles.dateText,
                selectedDate === day.date && styles.dateTextActive
              ]}
            >
              {day.dayNum}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Movies and Showtimes */}
      <ScrollView style={styles.moviesContainer}>
        {SHOWTIMES_DATA.map((movie) => (
          <ShowtimeCard key={movie.id} movie={movie} />
        ))}
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
    fontSize: 32,
    fontWeight: 'bold',
  },
  locationContainer: {
    paddingHorizontal: 20,
    marginBottom: -500,
  },
  locationContent: {
    paddingRight: 20,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    height: 40,
    backgroundColor: 'gray',
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationTextActive: {
    color: 'black',
  },
  dateContainer: {
    paddingHorizontal: 20,
    marginBottom: -500,
  },
  dateContent: {
    paddingRight: 20,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    height: 100,
    backgroundColor: 'gray',
    marginRight: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayTextActive: {
    color: 'black',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateTextActive: {
    color: 'black',
  },
  moviesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  movieCard: {
    backgroundColor: 'black',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  movieHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  moviePoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  movieMeta: {
    fontSize: 14,
    opacity: 0.7,
  },
  movieDetails: {
    marginTop: 4,
  },
  showtimesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  showtimeButton: {
    backgroundColor: 'black',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    position: 'relative',
  },
  showtimeButtonLoading: {
    opacity: 0.6,
  },
  showtimeButtonFullyBooked: {
    backgroundColor: '#ff4444',
    borderColor: '#cc0000',
    opacity: 0.7,
  },
  fullyBookedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#cc0000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  fullyBookedText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  showtimeTime: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  showtimeTimeDisabled: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  showtimeDetails: {
    fontSize: 11,
    opacity: 0.6,
  },
  showtimeDetailsDisabled: {
    opacity: 0.3,
  },
  queueInfo: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 4,
  },
  notificationSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  notifyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  notifyButtonActive: {
    backgroundColor: '#34C759',
  },
  notifyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  notifyButtonTextActive: {
    color: 'white',
  },
  showtimeButtonNew: {
    borderColor: '#34C759',
    borderWidth: 2,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  newShowtimeBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: '#34C759',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  newShowtimeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
