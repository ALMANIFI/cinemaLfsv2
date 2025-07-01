import { Image } from 'expo-image';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');
const movieWidth = (width - 60) / 2; 

const MOVIE_CATEGORIES = ['Now Showing', 'Coming Soon', 'Action', 'Comedy', 'Drama', 'Horror'];

const SAMPLE_MOVIES = [
  {
    id: '1',
    title: 'Guardians of the Galaxy Vol. 3',
    genre: 'Action/Adventure',
    rating: 'PG-13',
    duration: '150 min',
    image: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    category: 'Now Showing'
  },
  {
    id: '2',
    title: 'Fast X',
    genre: 'Action/Thriller',
    rating: 'PG-13',
    duration: '141 min',
    image: 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
    category: 'Now Showing'
  },
  {
    id: '3',
    title: 'The Little Mermaid',
    genre: 'Family/Musical',
    rating: 'PG',
    duration: '135 min',
    image: 'https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg',
    category: 'Now Showing'
  },
  {
    id: '4',
    title: 'Spider-Man: Across the Spider-Verse',
    genre: 'Animation/Action',
    rating: 'PG',
    duration: '140 min',
    image: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    category: 'Coming Soon'
  },
  {
    id: '5',
    title: 'John Wick: Chapter 4',
    genre: 'Action/Thriller',
    rating: 'R',
    duration: '169 min',
    image: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    category: 'Action'
  },
  {
    id: '6',
    title: 'Scream VI',
    genre: 'Horror/Mystery',
    rating: 'R',
    duration: '123 min',
    image: 'https://image.tmdb.org/t/p/w500/wDWwtvkRRlgTiUr6TyLSMX8FCuZ.jpg',
    category: 'Horror'
  }
];

export default function MoviesScreen() {
  const colorScheme = useColorScheme();
  const [selectedCategory, setSelectedCategory] = useState('Now Showing');

  const filteredMovies = SAMPLE_MOVIES.filter(movie => 
    selectedCategory === 'Now Showing' || selectedCategory === 'Coming Soon' 
      ? movie.category === selectedCategory 
      : movie.genre.toLowerCase().includes(selectedCategory.toLowerCase())
  );

  const MovieCard = ({ movie }: { movie: typeof SAMPLE_MOVIES[0] }) => (
    <TouchableOpacity style={styles.movieCard}>
      <Image
        source={{ uri: movie.image }}
        style={styles.movieImage}
        placeholder="Loading..."
      />
      <View style={styles.movieInfo}>
        <ThemedText style={styles.movieTitle} numberOfLines={2}>
          {movie.title}
        </ThemedText>
        <ThemedText style={styles.movieGenre}>
          {movie.genre}
        </ThemedText>
        <View style={styles.movieDetails}>
          <ThemedText style={styles.movieRating}>
            {movie.rating}
          </ThemedText>
          <ThemedText style={styles.movieDuration}>
            {movie.duration}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Movies
        </ThemedText>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {MOVIE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && {
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
              }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <ThemedText
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}
            >
              {category}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.moviesContainer}>
        <View style={styles.moviesGrid}>
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
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
    fontSize: 32,
    fontWeight: 'bold',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: -600,
  },
  categoryContent: {
    paddingRight: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 19,
    height: 70,
    borderRadius: 20,
    backgroundColor: 'gray',
    marginRight: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'balck',
  },
  moviesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  moviesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  movieCard: {
    width: movieWidth,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'black',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  movieImage: {
    width: '100%',
    height: movieWidth * 1.5,
    backgroundColor: '#e0e0e0',
  },
  movieInfo: {
    padding: 12,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieGenre: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  movieDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  movieRating: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  movieDuration: {
    fontSize: 12,
    opacity: 0.6,
  },
});
