const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Enhanced Configuration
const SPIKE_THRESHOLD = 20; // bookings in time window
const TIME_WINDOW_MINUTES = 5; // time window in minutes
const COOLDOWN_MINUTES = 30; // cooldown period between spike notifications for same movie
const MAX_NOTIFICATIONS_PER_HOUR = 3; // max notifications per movie per hour

/**
 * Enhanced Cloud Function: Check for booking spikes with cooldown
 * Triggered when checking for spikes or manually called
 */
exports.checkBookingSpike = functions.https.onCall(async (data, context) => {
  try {
    const { showtimeId, movieId, timestamp } = data;
    
    if (!showtimeId || !movieId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters: showtimeId and movieId'
      );
    }

    // Calculate time window
    const timeWindowMs = TIME_WINDOW_MINUTES * 60 * 1000;
    const cutoffTime = timestamp - timeWindowMs;

    // Get recent bookings for this showtime
    const bookingsRef = admin.database().ref(`bookings/${showtimeId}`);
    const snapshot = await bookingsRef
      .orderByChild('timestamp')
      .startAt(cutoffTime)
      .once('value');

    const bookings = snapshot.val();
    const bookingCount = bookings ? Object.keys(bookings).length : 0;

    console.log(`Showtime ${showtimeId}: ${bookingCount} bookings in last ${TIME_WINDOW_MINUTES} minutes`);

    // Check if spike threshold is reached
    const spikeDetected = bookingCount >= SPIKE_THRESHOLD;

    if (spikeDetected) {
      // Check cooldown period to avoid spam
      const canSendNotification = await checkNotificationCooldown(movieId, timestamp);
      
      if (canSendNotification) {
        console.log(`🔥 SPIKE DETECTED for movie ${movieId}! ${bookingCount} bookings - sending notifications`);
        
        // Trigger urgency notifications
        await sendUrgencyNotifications(movieId, bookingCount, showtimeId);
        
        // Update last notification timestamp
        await updateLastNotificationTime(movieId, timestamp);
        
        // Log spike event
        await admin.database().ref('spike_events').push({
          movieId,
          showtimeId,
          bookingCount,
          timestamp,
          timeWindow: TIME_WINDOW_MINUTES,
          notificationSent: true
        });
      } else {
        console.log(`Spike detected for movie ${movieId} but cooldown active - not sending notification`);
        
        // Log spike event without notification
        await admin.database().ref('spike_events').push({
          movieId,
          showtimeId,
          bookingCount,
          timestamp,
          timeWindow: TIME_WINDOW_MINUTES,
          notificationSent: false,
          reason: 'cooldown_active'
        });
      }
    }

    return {
      spikeDetected,
      bookingCount,
      threshold: SPIKE_THRESHOLD,
      timeWindow: TIME_WINDOW_MINUTES,
      notificationSent: spikeDetected ? await checkNotificationCooldown(movieId, timestamp) : false
    };

  } catch (error) {
    console.error('Error in checkBookingSpike:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Helper function: Check notification cooldown
 * Prevents spam notifications for the same movie
 */
async function checkNotificationCooldown(movieId, currentTimestamp) {
  try {
    const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
    const hourMs = 60 * 60 * 1000;
    
    // Get last notifications for this movie
    const notificationsRef = admin.database().ref(`notification_history/${movieId}`);
    const snapshot = await notificationsRef
      .orderByChild('timestamp')
      .startAt(currentTimestamp - hourMs)
      .once('value');
    
    const recentNotifications = snapshot.val();
    
    if (!recentNotifications) {
      return true; // No recent notifications, OK to send
    }
    
    const notifications = Object.values(recentNotifications);
    
    // Check cooldown period (last notification time)
    const lastNotification = notifications
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (lastNotification && (currentTimestamp - lastNotification.timestamp) < cooldownMs) {
      console.log(`Cooldown active for movie ${movieId}. Last notification: ${new Date(lastNotification.timestamp)}`);
      return false;
    }
    
    // Check max notifications per hour
    if (notifications.length >= MAX_NOTIFICATIONS_PER_HOUR) {
      console.log(`Max notifications per hour reached for movie ${movieId}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error checking notification cooldown:', error);
    return true; // Default to allow if error occurs
  }
}

/**
 * Helper function: Update last notification time
 */
async function updateLastNotificationTime(movieId, timestamp) {
  try {
    await admin.database().ref(`notification_history/${movieId}`).push({
      timestamp,
      type: 'spike_urgency'
    });
  } catch (error) {
    console.error('Error updating last notification time:', error);
  }
}

/**
 * Enhanced Cloud Function: Send urgency notifications
 * Called when a booking spike is detected
 */
async function sendUrgencyNotifications(movieId, bookingCount, showtimeId = null) {
  try {
    // Get all users interested in this movie
    const interestedUsersRef = admin.database().ref(`interested_users/${movieId}`);
    const snapshot = await interestedUsersRef.once('value');
    const interestedUsers = snapshot.val();

    if (!interestedUsers) {
      console.log(`No interested users found for movie ${movieId}`);
      return;
    }

    // Get movie details (you might want to store movie names in Firebase)
    const movieName = await getMovieName(movieId);

    // Prepare enhanced notification payload
    const notification = {
      title: '🔥 Hurry! Movie Selling Fast!',
      body: `"${movieName}" is selling out quickly! ${bookingCount} tickets booked in the last 5 minutes. Book now!`
    };

    const data = {
      type: 'urgency',
      movieId: movieId,
      showtimeId: showtimeId || '',
      bookingCount: bookingCount.toString(),
      timestamp: Date.now().toString(),
      urgencyLevel: bookingCount >= 30 ? 'high' : 'medium'
    };

    // Send to topic (all interested users should subscribe to this topic)
    const topicMessage = {
      notification,
      data,
      topic: `urgency_movie_${movieId}`
    };

    await admin.messaging().send(topicMessage);
    console.log(`Urgency notification sent to topic: urgency_movie_${movieId}`);

    // Also send to individual FCM tokens (backup method)
    const tokens = [];
    Object.values(interestedUsers).forEach(user => {
      if (user.fcmToken && user.notificationEnabled) {
        tokens.push(user.fcmToken);
      }
    });

    if (tokens.length > 0) {
      const multicastMessage = {
        notification,
        data,
        tokens
      };

      const response = await admin.messaging().sendMulticast(multicastMessage);
      console.log(`Urgency notifications sent to ${response.successCount} users`);
      
      if (response.failureCount > 0) {
        console.log(`Failed to send to ${response.failureCount} users`);
      }
    }

  } catch (error) {
    console.error('Error sending urgency notifications:', error);
    throw error;
  }
}

/**
 * Helper function to get movie name
 * You can store movie details in Firebase or fetch from external API
 */
async function getMovieName(movieId) {
  try {
    // Try to get from Firebase first
    const movieRef = admin.database().ref(`movies/${movieId}/title`);
    const snapshot = await movieRef.once('value');
    const movieName = snapshot.val();
    
    if (movieName) {
      return movieName;
    }

    // Fallback movie names (you can expand this)
    const movieNames = {
      '1': 'Guardians of the Galaxy Vol. 3',
      '2': 'Fast X',
      '3': 'The Little Mermaid',
      '4': 'Spider-Man: Across the Spider-Verse',
      '5': 'John Wick: Chapter 4',
      '6': 'Scream VI'
    };

    return movieNames[movieId] || 'Movie';
  } catch (error) {
    console.error('Error getting movie name:', error);
    return 'Movie';
  }
}

/**
 * Cloud Function: Manual trigger for urgency notifications (for testing)
 */
exports.sendUrgencyNotifications = functions.https.onCall(async (data, context) => {
  try {
    const { movieId, userTokens, message } = data;
    
    if (!movieId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameter: movieId'
      );
    }

    const movieName = await getMovieName(movieId);
    
    const notification = {
      title: '🔥 Hurry! Movie Selling Fast!',
      body: message || `"${movieName}" is selling out quickly!`
    };

    const notificationData = {
      type: 'urgency',
      movieId: movieId,
      timestamp: Date.now().toString()
    };

    // Send to topic
    const topicMessage = {
      notification,
      data: notificationData,
      topic: `urgency_movie_${movieId}`
    };

    await admin.messaging().send(topicMessage);
    console.log(`Manual urgency notification sent to topic: urgency_movie_${movieId}`);

    // Send to specific tokens if provided
    if (userTokens && userTokens.length > 0) {
      const multicastMessage = {
        notification,
        data: notificationData,
        tokens: userTokens
      };

      const response = await admin.messaging().sendMulticast(multicastMessage);
      console.log(`Manual notifications sent to ${response.successCount} users`);
    }

    return {
      success: true,
      message: 'Urgency notifications sent successfully'
    };

  } catch (error) {
    console.error('Error in sendUrgencyNotifications:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Database Trigger: Auto-detect spikes when new bookings are added
 */
exports.onBookingAdded = functions.database
  .ref('/bookings/{showtimeId}/{bookingId}')
  .onCreate(async (snapshot, context) => {
    try {
      const booking = snapshot.val();
      const { showtimeId } = context.params;
      
      if (!booking.movieId) {
        console.log('Booking missing movieId, skipping spike detection');
        return;
      }

      console.log(`New booking added for showtime ${showtimeId}, checking for spike...`);
      
      // Check for spike
      const spikeResult = await exports.checkBookingSpike.run({
        showtimeId,
        movieId: booking.movieId,
        timestamp: booking.timestamp || Date.now()
      });

      if (spikeResult.spikeDetected) {
        console.log(`Auto-detected spike for showtime ${showtimeId}`);
      }

    } catch (error) {
      console.error('Error in onBookingAdded trigger:', error);
    }
  });

/**
 * Scheduled function: Clean up old bookings (runs daily)
 */
exports.cleanupOldBookings = functions.pubsub
  .schedule('0 2 * * *') // Run at 2 AM daily
  .timeZone('Asia/Kuala_Lumpur')
  .onRun(async (context) => {
    try {
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const bookingsRef = admin.database().ref('bookings');
      const snapshot = await bookingsRef.once('value');
      const bookings = snapshot.val();
      
      if (!bookings) return;
      
      let deletedCount = 0;
      const updates = {};
      
      // Mark old bookings for deletion
      Object.keys(bookings).forEach(showtimeId => {
        const showtimeBookings = bookings[showtimeId];
        Object.keys(showtimeBookings).forEach(bookingId => {
          const booking = showtimeBookings[bookingId];
          if (booking.timestamp < cutoffTime) {
            updates[`bookings/${showtimeId}/${bookingId}`] = null;
            deletedCount++;
          }
        });
      });
      
      if (deletedCount > 0) {
        await admin.database().ref().update(updates);
        console.log(`Cleaned up ${deletedCount} old bookings`);
      }
      
    } catch (error) {
      console.error('Error in cleanupOldBookings:', error);
    }
  });
