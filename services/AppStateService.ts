// Simple global state management for the cinema app
class AppStateService {
  private static instance: AppStateService;
  private listeners: { [key: string]: Function[] } = {};
  private state: { [key: string]: any } = {
    trendingMovies: {}, // movieId -> true/false
    ticketSales: {}, // movieId -> number of tickets sold
    notificationQueue: {}, // movieId -> array of user IDs waiting for new screenings
    newShowtimes: {}, // movieId -> array of new showtimes added dynamically
  };

  private constructor() {}

  static getInstance(): AppStateService {
    if (!AppStateService.instance) {
      AppStateService.instance = new AppStateService();
    }
    return AppStateService.instance;
  }

  // Set a movie as trending/selling fast
  setMovieTrending(movieId: string, isTrending: boolean = true) {
    console.log(`Setting movie ${movieId} trending status to: ${isTrending}`);
    this.state.trendingMovies[movieId] = isTrending;
    console.log('Current trending movies state:', this.state.trendingMovies);
    this.notifyListeners('trendingMovies');
    console.log(`Movie ${movieId} trending status: ${isTrending}`);
  }

  // Add tickets to a movie's sales count
  addTicketSales(movieId: string, ticketCount: number = 25) {
    console.log(`Adding ${ticketCount} tickets to movie ${movieId}`);
    const currentSales = this.state.ticketSales[movieId] || 0;
    this.state.ticketSales[movieId] = currentSales + ticketCount;
    
    // Notify listeners that trending movies may have changed
    this.notifyListeners('trendingMovies');
    
    console.log(`Movie ${movieId} total ticket sales: ${this.state.ticketSales[movieId]}`);
    console.log('All ticket sales:', this.state.ticketSales);
  }

  // Get ticket sales for a movie
  getTicketSales(movieId: string): number {
    return this.state.ticketSales[movieId] || 0;
  }

  // Get all ticket sales
  getAllTicketSales(): { [movieId: string]: number } {
    return { ...this.state.ticketSales };
  }

  // Check if a movie is trending (in top 5 by sales)
  isMovieTrending(movieId: string): boolean {
    const trendingMovies = this.getTrendingMovies();
    return trendingMovies.includes(movieId);
  }

  // Get top 5 trending movies sorted by ticket sales (highest first)
  getTrendingMovies(): string[] {
    // Get all movies with ticket sales (regardless of trending status)
    const moviesWithSales = Object.keys(this.state.ticketSales).filter(
      movieId => (this.state.ticketSales[movieId] || 0) > 0
    );
    
    // Sort by ticket sales (highest first) and limit to top 5
    const sortedTrending = moviesWithSales
      .sort((a, b) => {
        const salesA = this.state.ticketSales[a] || 0;
        const salesB = this.state.ticketSales[b] || 0;
        return salesB - salesA; // Descending order
      })
      .slice(0, 5); // Limit to top 5
    
    console.log('getTrendingMovies called, returning top 5 by sales:', sortedTrending);
    console.log('Sales data:', sortedTrending.map(id => ({ id, sales: this.state.ticketSales[id] || 0 })));
    return sortedTrending;
  }

  // Get the ranking position of a specific movie (1-based)
  getMovieRanking(movieId: string): number | null {
    const trendingMovies = this.getTrendingMovies();
    const rank = trendingMovies.indexOf(movieId);
    return rank === -1 ? null : rank + 1;
  }

  // Add user to notification queue for a movie
  addToNotificationQueue(movieId: string, userId: string) {
    console.log(`Adding user ${userId} to notification queue for movie ${movieId}`);
    if (!this.state.notificationQueue[movieId]) {
      this.state.notificationQueue[movieId] = [];
    }
    
    // Avoid duplicates
    if (!this.state.notificationQueue[movieId].includes(userId)) {
      this.state.notificationQueue[movieId].push(userId);
      this.notifyListeners('notificationQueue');
      console.log(`User ${userId} added to queue for ${movieId}`);
      console.log('Current notification queue:', this.state.notificationQueue);
    } else {
      console.log(`User ${userId} already in queue for ${movieId}`);
    }
  }

  // Remove user from notification queue for a movie
  removeFromNotificationQueue(movieId: string, userId: string) {
    if (this.state.notificationQueue[movieId]) {
      this.state.notificationQueue[movieId] = this.state.notificationQueue[movieId].filter(
        (id: string) => id !== userId
      );
      this.notifyListeners('notificationQueue');
      console.log(`User ${userId} removed from queue for ${movieId}`);
    }
  }

  // Get all users in notification queue for a movie
  getNotificationQueue(movieId: string): string[] {
    return this.state.notificationQueue[movieId] || [];
  }

  // Get all movies with notification queues
  getMoviesWithNotificationQueues(): { movieId: string; userCount: number }[] {
    return Object.keys(this.state.notificationQueue)
      .filter(movieId => this.state.notificationQueue[movieId].length > 0)
      .map(movieId => ({
        movieId,
        userCount: this.state.notificationQueue[movieId].length
      }));
  }

  // Clear notification queue for a movie (when new screening is opened)
  clearNotificationQueue(movieId: string): string[] {
    const users = this.state.notificationQueue[movieId] || [];
    this.state.notificationQueue[movieId] = [];
    this.notifyListeners('notificationQueue');
    console.log(`Cleared notification queue for ${movieId}, notified ${users.length} users`);
    return users;
  }

  // Check if user is in notification queue for a movie
  isUserInNotificationQueue(movieId: string, userId: string): boolean {
    return this.state.notificationQueue[movieId]?.includes(userId) || false;
  }

  // Add a new showtime to a movie
  addNewShowtime(movieId: string, showtime: { time: string; hall: string; type: string }) {
    console.log(`Adding new showtime for movie ${movieId}:`, showtime);
    if (!this.state.newShowtimes) {
      this.state.newShowtimes = {};
    }
    if (!this.state.newShowtimes[movieId]) {
      this.state.newShowtimes[movieId] = [];
    }
    
    // Add the new showtime with isFullyBooked: false
    const newShowtimeEntry = {
      ...showtime,
      isFullyBooked: false,
      id: `new_${Date.now()}_${Math.random()}` // Unique ID for the new showtime
    };
    
    this.state.newShowtimes[movieId].push(newShowtimeEntry);
    this.notifyListeners('newShowtimes');
    console.log(`New showtime added for ${movieId}:`, newShowtimeEntry);
    return newShowtimeEntry;
  }

  // Get new showtimes for a movie
  getNewShowtimes(movieId: string) {
    return this.state.newShowtimes?.[movieId] || [];
  }

  // Get all new showtimes
  getAllNewShowtimes() {
    return { ...this.state.newShowtimes };
  }

  // Subscribe to state changes
  subscribe(key: string, callback: Function) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  // Notify all listeners of a state change
  private notifyListeners(key: string) {
    console.log(`Notifying listeners for key: ${key}`);
    console.log(`Number of listeners: ${this.listeners[key]?.length || 0}`);
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => {
        console.log('Calling listener callback');
        callback(this.state[key]);
      });
    }
  }

  // Get current state
  getState() {
    return { ...this.state };
  }
}

export default AppStateService;
