import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import FirebaseService from '@/services/FirebaseService';
import NotificationService from '@/services/NotificationService';
import UserService from '@/services/UserService';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize Firebase services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('Initializing services...');
        const userService = UserService.getInstance();
        const firebaseService = FirebaseService.getInstance();
        const notificationService = NotificationService.getInstance();
        
        // Initialize user service first
        await userService.initialize();
        
        // Then initialize Firebase services
        await firebaseService.initialize();
        await notificationService.initialize();
        
        console.log('All services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
