import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import NotificationService from '@/services/NotificationService';

const USER_DATA = {
  name: 'John Doe',
  email: 'john.doe@email.com',
  phone: '+60 12-345-6789',
  membershipLevel: 'Gold Member',
  points: 2450,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
};

const BOOKING_HISTORY = [
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

const MENU_ITEMS = [
  { icon: 'doc.text.fill' as const, title: 'My Tickets', subtitle: 'View and manage your bookings' },
  { icon: 'heart.fill' as const, title: 'Watchlist', subtitle: 'Your favorite movies' },
  { icon: 'gift.fill' as const, title: 'Rewards', subtitle: 'Redeem points and offers' },
  { icon: 'creditcard.fill' as const, title: 'Payment Methods', subtitle: 'Manage your cards' },
  { icon: 'bell.fill' as const, title: 'Notifications', subtitle: 'Movie updates and reminders' },
  { icon: 'questionmark.circle.fill' as const, title: 'Help & Support', subtitle: 'Get assistance' },
  { icon: 'gearshape.fill' as const, title: 'Settings', subtitle: 'App preferences' },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const [notificationSettings, setNotificationSettings] = useState({
    movieReminders: true,
    fastSelling: true,
    newMovies: false,
    promotions: true,
  });
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Load notification settings from preferences
    // In a real app, you'd load these from storage/API
  }, []);

  const toggleNotification = async (key: keyof typeof notificationSettings) => {
    if (isUpdatingNotifications) return;
    
    setIsUpdatingNotifications(true);
    
    try {
      const newSettings = {
        ...notificationSettings,
        [key]: !notificationSettings[key]
      };
      
      // Update Firebase topic subscriptions
      await notificationService.updateNotificationPreferences({
        fastSelling: newSettings.fastSelling,
        movieReminders: newSettings.movieReminders,
        newMovies: newSettings.newMovies,
        promotions: newSettings.promotions,
      });
      
      setNotificationSettings(newSettings);
      
      // Show success feedback
      Alert.alert(
        'Settings Updated',
        'Your notification preferences have been saved.'
      );
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert(
        'Error',
        'Failed to update notification settings. Please try again.'
      );
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleMenuItemPress = (title: string) => {
    Alert.alert(title, `${title} feature coming soon!`);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => console.log('Sign out') }
      ]
    );
  };

  const BookingCard = ({ booking }: { booking: typeof BOOKING_HISTORY[0] }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <ThemedText style={styles.movieTitle}>{booking.movie}</ThemedText>
        <View style={[
          styles.statusBadge,
          { backgroundColor: booking.status === 'Upcoming' ? '#007AFF' : '#34C759' }
        ]}>
          <ThemedText style={styles.statusText}>{booking.status}</ThemedText>
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.bookingRow}>
          <IconSymbol name="calendar" size={16} color="#666" />
          <ThemedText style={styles.bookingText}>
            {booking.date} at {booking.time}
          </ThemedText>
        </View>
        
        <View style={styles.bookingRow}>
          <IconSymbol name="location.fill" size={16} color="#666" />
          <ThemedText style={styles.bookingText}>
            {booking.cinema} - {booking.hall}
          </ThemedText>
        </View>
        
        <View style={styles.bookingRow}>
          <IconSymbol name="doc.text.fill" size={16} color="#666" />
          <ThemedText style={styles.bookingText}>
            Seats: {booking.seats}
          </ThemedText>
        </View>
        
        <View style={styles.bookingRow}>
          <IconSymbol name="creditcard.fill" size={16} color="#666" />
          <ThemedText style={styles.bookingText}>
            Total: {booking.total}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: USER_DATA.avatar }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <ThemedText style={styles.name}>{USER_DATA.name}</ThemedText>
            <ThemedText style={styles.email}>{USER_DATA.email}</ThemedText>
            <View style={styles.membershipBadge}>
              <ThemedText style={styles.membershipText}>
                {USER_DATA.membershipLevel}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Points Card */}
        <View style={[styles.pointsCard, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <View style={styles.pointsContent}>
            <ThemedText style={styles.pointsLabel}>Reward Points</ThemedText>
            <ThemedText style={styles.pointsValue}>{USER_DATA.points.toLocaleString()}</ThemedText>
          </View>
          <TouchableOpacity style={styles.redeemButton}>
            <ThemedText style={styles.redeemText}>Redeem</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item.title)}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name={item.icon} size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <View style={styles.menuItemText}>
                  <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
                  <ThemedText style={styles.menuItemSubtitle}>{item.subtitle}</ThemedText>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification Preferences */}
        <View style={styles.menuSection}>
          <ThemedText style={styles.sectionTitle}>Notification Preferences</ThemedText>
          
          <View style={styles.notificationItem}>
            <View style={styles.notificationLeft}>
              <IconSymbol name="bell.fill" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <View style={styles.notificationText}>
                <ThemedText style={styles.notificationTitle}>Fast Selling Movies</ThemedText>
                <ThemedText style={styles.notificationSubtitle}>Get notified when your interested movies are selling fast</ThemedText>
              </View>
            </View>
            <Switch
              value={notificationSettings.fastSelling}
              onValueChange={() => toggleNotification('fastSelling')}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              disabled={isUpdatingNotifications}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationLeft}>
              <IconSymbol name="clock.fill" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <View style={styles.notificationText}>
                <ThemedText style={styles.notificationTitle}>Movie Reminders</ThemedText>
                <ThemedText style={styles.notificationSubtitle}>Reminders for your upcoming bookings</ThemedText>
              </View>
            </View>
            <Switch
              value={notificationSettings.movieReminders}
              onValueChange={() => toggleNotification('movieReminders')}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              disabled={isUpdatingNotifications}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationLeft}>
              <IconSymbol name="star.fill" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <View style={styles.notificationText}>
                <ThemedText style={styles.notificationTitle}>New Movies</ThemedText>
                <ThemedText style={styles.notificationSubtitle}>Get notified about new movie releases</ThemedText>
              </View>
            </View>
            <Switch
              value={notificationSettings.newMovies}
              onValueChange={() => toggleNotification('newMovies')}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              disabled={isUpdatingNotifications}
            />
          </View>

          <View style={styles.notificationItem}>
            <View style={styles.notificationLeft}>
              <IconSymbol name="gift.fill" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <View style={styles.notificationText}>
                <ThemedText style={styles.notificationTitle}>Promotions & Offers</ThemedText>
                <ThemedText style={styles.notificationSubtitle}>Special deals and discount notifications</ThemedText>
              </View>
            </View>
            <Switch
              value={notificationSettings.promotions}
              onValueChange={() => toggleNotification('promotions')}
              trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'light'].tint }}
              disabled={isUpdatingNotifications}
            />
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.bookingsSection}>
          <ThemedText style={styles.sectionTitle}>Recent Bookings</ThemedText>
          {BOOKING_HISTORY.slice(0, 3).map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 8,
  },
  membershipBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  membershipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  pointsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsContent: {
    flex: 1,
  },
  pointsLabel: {
    color: 'BLACK   ',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  pointsValue: {
    color: 'BLACK',
    fontSize: 20,
    fontWeight: 'bold',

  },
  redeemButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  redeemText: {
    color: 'BLACK',
    fontWeight: 'bold',
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  bookingsSection: {
    padding: 20,
  },
  bookingCard: {
    backgroundColor: 'GRAY',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingDetails: {
    gap: 8,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingText: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.8,
  },
  signOutButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: 16,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});
