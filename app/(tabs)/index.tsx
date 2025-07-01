import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppStateService from '@/services/AppStateService';
import FirebaseService from '@/services/FirebaseService';
import UserService from '@/services/UserService';

interface Movie {
  id: string;
  title: string;
  image: string;
  description?: string;
  rating?: string;
  genre?: string;
}

// All available movies (pool of movies for trending)
const ALL_MOVIES: Movie[] = [
  // Original trending pool movies
  {
    id: '1',
    title: 'Guardians of the Galaxy Vol. 3',
    image: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    description: 'The epic conclusion to the Guardians trilogy.'
  },
  {
    id: '2',
    title: 'Fast X',
    image: 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
    description: 'The end of the road begins.'
  },
  {
    id: '3',
    title: 'The Little Mermaid',
    image: 'https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg',
    description: 'Dive into an underwater adventure.'
  },
  // Now Showing movies (can also become trending)
  {
    id: '4',
    title: 'John Wick: Chapter 4',
    image: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    description: 'Baba Yaga is back for one final mission.',
    rating: 'R',
    genre: 'Action'
  },
  {
    id: '5',
    title: 'Scream VI',
    image: 'https://image.tmdb.org/t/p/w500/wDWwtvkRRlgTiUr6TyLSMX8FCuZ.jpg',
    description: 'The Ghostface killer returns to terrorize a new generation.',
    rating: 'R',
    genre: 'Horror'
  },
  {
    id: '6',
    title: 'Ant-Man and the Wasp: Quantumania',
    image: 'https://image.tmdb.org/t/p/w500/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg',
    description: 'The smallest heroes face their biggest challenge yet.',
    rating: 'PG-13',
    genre: 'Action'
  },
  {
    id: '7',
    title: 'Spider-Man: Across the Spider-Verse',
    image: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    description: 'Miles Morales catapults across the Multiverse.',
    rating: 'PG',
    genre: 'Animation'
  }
];

const NOW_SHOWING: Movie[] = [
  // Original movies
  {
    id: '1',
    title: 'Guardians of the Galaxy Vol. 3',
    image: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    rating: 'PG-13',
    genre: 'Action'
  },
  {
    id: '2',
    title: 'Fast X',
    image: 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
    rating: 'PG-13',
    genre: 'Action'
  },
  {
    id: '3',
    title: 'The Little Mermaid',
    image: 'https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg',
    rating: 'PG',
    genre: 'Family'
  },
  // Additional movies
  {
    id: '4',
    title: 'John Wick: Chapter 4',
    image: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    rating: 'R',
    genre: 'Action'
  },
  {
    id: '5',
    title: 'Scream VI',
    image: 'https://image.tmdb.org/t/p/w500/wDWwtvkRRlgTiUr6TyLSMX8FCuZ.jpg',
    rating: 'R',
    genre: 'Horror'
  },
  {
    id: '6',
    title: 'Ant-Man and the Wasp: Quantumania',
    image: 'https://image.tmdb.org/t/p/w500/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg',
    rating: 'PG-13',
    genre: 'Action'
  },
  {
    id: '7',
    title: 'Spider-Man: Across the Spider-Verse',
    image: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    rating: 'PG',
    genre: 'Animation'
  }
];

export default function HomeScreen() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const appStateService = AppStateService.getInstance();
  const firebaseService = FirebaseService.getInstance();
  const userService = UserService.getInstance();

  // Subscribe to trending movie changes
  useEffect(() => {
    console.log('HomeScreen: Setting up trending movie subscription');
    
    const updateTrendingMovies = () => {
      console.log('HomeScreen: updateTrendingMovies called');
      const trendingIds = appStateService.getTrendingMovies();
      console.log('HomeScreen: Trending IDs (sorted by sales):', trendingIds);
      
      // Preserve the sorted order by mapping trendingIds to movie objects
      const trending = trendingIds
        .map(movieId => ALL_MOVIES.find(movie => movie.id === movieId))
        .filter(movie => movie !== undefined) as Movie[];
      
      console.log('HomeScreen: Trending Movies (in correct order):', trending);
      setTrendingMovies(trending);
      console.log('HomeScreen: State updated with', trending.length, 'trending movies');
    };

    // Initial load
    updateTrendingMovies();

    // Subscribe to changes
    const unsubscribe = appStateService.subscribe('trendingMovies', updateTrendingMovies);
    return unsubscribe;
  }, [appStateService]);

  const MovieCard = ({ movie, isLarge = false, showSellingFast = false, ranking }: { 
    movie: Movie, 
    isLarge?: boolean, 
    showSellingFast?: boolean,
    ranking?: number
  }) => (
    <TouchableOpacity style={[styles.movieCard, isLarge && styles.largeMovieCard]}>
      <Image
        source={{ uri: movie.image }}
        style={[styles.movieImage, isLarge && styles.largeMovieImage]}
      />
      {/* Only show dynamic Selling Fast badge for trending movies - NO hardcoded badges */}
      {showSellingFast && (
        <View style={styles.hotBadgeContainer}>
          <View style={styles.sellingFastBadge}>
            <ThemedText style={styles.sellingFastText}>🔥 Selling Fast!</ThemedText>
          </View>
        </View>
      )}
      {/* Show ranking for trending movies */}
      {ranking && (
        <View style={styles.rankingContainer}>
          <View style={styles.rankingBadge}>
            <ThemedText style={styles.rankingText}>
              {ranking === 1 ? '👑 Top 1' : ranking === 2 ? '🥈 Top 2' : ranking === 3 ? '🥉 Top 3' : `#${ranking}`}
            </ThemedText>
          </View>
        </View>
      )}
      <View style={styles.movieOverlay}>
        <ThemedText style={[styles.movieTitle, isLarge && styles.largeMovieTitle]}>
          {movie.title}
        </ThemedText>
        {movie.description && (
          <ThemedText style={styles.movieDescription}>
            {movie.description}
          </ThemedText>
        )}
        {movie.genre && (
          <ThemedText style={styles.movieGenre}>
            {movie.rating} • {movie.genre}
          </ThemedText>
        )}
        {ranking && (
          <ThemedText style={styles.ticketSalesText}>
            🎫 {appStateService.getTicketSales(movie.id)} tickets sold
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );

  // Spike simulation function
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
        `${movieTitle} now has ${totalSales} total tickets sold!\n\nCheck the Trending Now section - movies are sorted by ticket sales!`,
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

  // Show movie selection for spike testing
  const showMovieSpike = () => {
    const movieOptions = ALL_MOVIES.map(movie => ({
      text: `${movie.title} (${appStateService.getTicketSales(movie.id)} sold)`,
      onPress: () => simulateBookingSpike(movie.id, movie.title),
    }));

    Alert.alert(
      '🔥 Spike Test - Select Movie',
      'Choose a movie to simulate 25 bookings and make it trending:',
      [
        ...movieOptions,
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#1a1a2e', dark: '#1a1a2e' }}
      headerImage={
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1489599556463-c6e0c6aa1d1b?w=800&h=400&fit=crop' }}
            style={styles.headerImage}
          />
          <View style={styles.headerOverlay}>
            <View style={styles.headerLeft}>
              <Image
                source={require('@/images/LFS.jpg')}
                style={styles.logoImage}
              />
              <ThemedText style={styles.logoText}></ThemedText>
            </View>
            <View style={styles.headerCenter}>
              <ThemedText style={styles.discoverText}>Discover</ThemedText>
            </View>
            <View style={styles.headerRight}>
              {/* Space for future elements like notifications or profile */}
            </View>
          </View>
        </View>
      }>
      
      {/* this is the "trending Now" Section: it is just limited to 5 movies (top five like that) */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>🏆 Top 5 Trending Now</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {trendingMovies.length > 0 ? (
            trendingMovies.map((movie, index) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                isLarge 
                showSellingFast={appStateService.isMovieTrending(movie.id)}
                ranking={index + 1}
              />
            ))
          ) : (
            <View style={styles.emptyTrendingContainer}>
              <ThemedText style={styles.emptyTrendingText}>
                No trending movies yet!!!
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </ThemedView>

      {/* Now Showing Section */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Now Showing</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {NOW_SHOWING.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </ScrollView>
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionButtonText}>Buy Tickets</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <ThemedText style={styles.actionButtonText}>View Showtimes</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.spikeButton]} 
            onPress={showMovieSpike}
            disabled={isLoading}
          >
            <ThemedText style={[styles.actionButtonText, styles.spikeButtonText]}>
              {isLoading ? '🔄 Spiking...' : '🔥 Spike Movie'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Cinema Locations */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Our Locations</ThemedText>
        <View style={styles.locationsList}>
          <View style={styles.locationItem}>
            <ThemedText style={styles.locationName}>LFS Cinema Pavilion KL</ThemedText>
            <ThemedText style={styles.locationAddress}>168, Jalan Bukit Bintang, Kuala Lumpur</ThemedText>
          </View>
          <View style={styles.locationItem}>
            <ThemedText style={styles.locationName}>LFS Cinema Subang</ThemedText>
            <ThemedText style={styles.locationAddress}>Subang Jaya, Selangor</ThemedText>
          </View>
          <View style={styles.locationItem}>
            <ThemedText style={styles.locationName}>LFS Cinema Setapak</ThemedText>
            <ThemedText style={styles.locationAddress}>Setapak Central, Kuala Lumpur</ThemedText>
          </View>
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 250,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoImage: {
    width: 55,
    height: 30,
    marginRight: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  discoverText: {
    color: 'yellow',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  horizontalScroll: {
    marginLeft: -20,
    paddingLeft: 20,
  },
  movieCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  largeMovieCard: {
    width: 200,
  },
  movieImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#e0e0e0',
  },
  largeMovieImage: {
    height: 300,
  },
  movieOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
  },
  movieTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  largeMovieTitle: {
    fontSize: 16,
  },
  movieDescription: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  movieGenre: {
    color: 'white',
    fontSize: 11,
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 110,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spikeButton: {
    backgroundColor: '#FF3B30',
  },
  spikeButtonText: {
    color: 'white',
  },
  locationsList: {
    gap: 16,
  },
  locationItem: {
    backgroundColor: 'gray',
    padding: 16,
    borderRadius: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    opacity: 0.7,
  },
  hotBadgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  sellingFastBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sellingFastText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyTrendingContainer: {
    width: 300,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  emptyTrendingText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  rankingContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  rankingBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  rankingText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ticketSalesText: {
    color: 'white',
    fontSize: 11,
    opacity: 0.9,
    fontWeight: '600',
    marginTop: 2,
  },
});
