/**
 * User Management Service
 * Handles user authentication, session management, and user data
 * For demo purposes, generates mock user IDs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  membershipLevel: string;
  points: number;
  avatar?: string;
  createdAt: number;
}

class UserService {
  private static instance: UserService;
  private currentUser: User | null = null;
  
  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Initialize user service and restore session
   */
  async initialize(): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        console.log('User session restored:', this.currentUser?.name);
      } else {
        // Create demo user for development
        await this.createDemoUser();
      }
    } catch (error) {
      console.error('Error initializing user service:', error);
      await this.createDemoUser();
    }
  }

  /**
   * Create a demo user for development/testing
   */
  private async createDemoUser(): Promise<void> {
    try {
      const demoUser: User = {
        id: `demo_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+60 12-345-6789',
        membershipLevel: 'Gold Member',
        points: 2450,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        createdAt: Date.now()
      };

      this.currentUser = demoUser;
      await AsyncStorage.setItem('user_data', JSON.stringify(demoUser));
      console.log('Demo user created:', demoUser.name);
    } catch (error) {
      console.error('Error creating demo user:', error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUser?.id || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Update user points
   */
  async updateUserPoints(points: number): Promise<void> {
    try {
      if (this.currentUser) {
        this.currentUser.points = points;
        await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.error('Error updating user points:', error);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<User>): Promise<void> {
    try {
      if (this.currentUser) {
        this.currentUser = { ...this.currentUser, ...updates };
        await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));
        console.log('User profile updated');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem('user_data');
      this.currentUser = null;
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Get user's booking history (mock data for demo)
   */
  getUserBookingHistory() {
    return [
      {
        id: '1',
        movie: 'Guardians of the Galaxy Vol. 3',
        date: 'May 15, 2024',
        time: '7:15 PM',
        cinema: 'LFS Cinema Pavilion KL',
        hall: 'Hall 3',
        seats: 'F12, F13',
        total: 'RM 35.00',
        status: 'Completed'
      },
      {
        id: '2',
        movie: 'Fast X',
        date: 'May 10, 2024',
        time: '8:30 PM',
        cinema: 'LFS Cinema Subang',
        hall: 'Hall 1',
        seats: 'G8, G9',
        total: 'RM 30.00',
        status: 'Completed'
      },
      {
        id: '3',
        movie: 'The Little Mermaid',
        date: 'July 5, 2024',
        time: '3:00 PM',
        cinema: 'LFS Cinema Pavilion KL',
        hall: 'Hall 2',
        seats: 'D15, D16',
        total: 'RM 28.00',
        status: 'Upcoming'
      }
    ];
  }
}

export default UserService;
