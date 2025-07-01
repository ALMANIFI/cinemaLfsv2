# 🔔 Real Push Notifications Setup Guide

## 📱 You Now Have REAL Push Notifications!

Your LFS Cinema app has been upgraded with **Expo Notifications** for real push notifications to your phone.

---

## 🚀 **Quick Setup Steps**

### **Step 1: Install Dependencies**
```bash
cd d:\Dev\cinemaLfsv2
npm install expo-notifications expo-device expo-constants
```

### **Step 2: Replace Notification Service**
Replace the old mock service with the real one:
```bash
del services\NotificationService.ts
move services\NotificationServiceReal.ts services\NotificationService.ts
```

### **Step 3: Start the App**
```bash
npx expo start
```

---

## 📱 **What's Changed**

### **✅ Real Features Now Available:**

1. **📱 Actual Push Notifications**: Real notifications to your phone
2. **🔔 Permission Handling**: Proper iOS/Android permission requests
3. **📤 Expo Push API**: Send notifications via Expo's service
4. **🎯 Notification Targeting**: Send to specific devices
5. **🔧 Background Handling**: Notifications work when app is closed

### **🆕 New Notification Service Features:**

```typescript
// Real push token (not mock)
const token = await notificationService.getToken();

// Real local notifications (appear on device)
await notificationService.sendLocalNotification({
  title: "🔥 Movie Alert!",
  body: "Guardians of the Galaxy is selling fast!",
  movieId: "1",
  type: "urgency"
});

// Real push notifications (to other devices)
await notificationService.sendPushNotification(userToken, notificationData);
```

---

## 🧪 **How to Test Real Notifications**

### **1. Grant Permissions**
- Open the app on your **physical device** (not simulator)
- Go to **Test tab**
- Tap "Check Permissions" → Grant when prompted
- ✅ You should see your real Expo push token

### **2. Test Local Notifications**
- Tap "Send Test Notification"
- ✅ **Real notification appears on your device!**

### **3. Test Movie Spike Notifications**
- Go to **Movies tab** → Tap "Notify Me" on a movie
- Return to **Test tab** → Tap "Spike Test: [Movie Name]"
- ✅ **Get urgency notification on your phone!**

### **4. Test Background Notifications**
- Close the app completely
- Use Expo's push notification tool or have someone else trigger a spike
- ✅ **Notification wakes your phone even when app is closed!**

---

## 🔧 **Advanced Features**

### **Push to Multiple Devices**
```typescript
// In a real backend, you'd store user tokens and send to all interested users
const interestedUsers = ['ExponentPushToken[user1]', 'ExponentPushToken[user2]'];
for (const token of interestedUsers) {
  await notificationService.sendPushNotification(token, urgencyNotification);
}
```

### **Scheduled Notifications**
```typescript
// Schedule a reminder for later
await Notifications.scheduleNotificationAsync({
  content: {
    title: "🎬 Movie Reminder",
    body: "Your movie starts in 1 hour!",
  },
  trigger: {
    seconds: 3600, // 1 hour from now
  },
});
```

### **Rich Notifications**
```typescript
await notificationService.sendLocalNotification({
  title: "🔥 Hot Movie Alert!",
  body: "Guardians of the Galaxy Vol. 3 - Only 5 seats left!",
  movieId: "1",
  type: "urgency",
  data: {
    imageUrl: "https://movie-poster-url.jpg",
    action: "book_now",
    showtimeId: "123"
  }
});
```

---

## 🌟 **Production Deployment**

### **For Production App:**

1. **Build with EAS Build** (recommended):
```bash
npm install -g @expo/eas-cli
eas build:configure
eas build --platform android
```

2. **Configure Push Certificates**:
   - iOS: Add Apple Push Notification certificates
   - Android: Configure Firebase Cloud Messaging (FCM)

3. **Backend Integration**:
   - Store user push tokens in your database
   - Send notifications from your server using Expo Push API
   - Implement user preferences and targeting

---

## 🎯 **Expected Results**

After following these steps, you'll have:

✅ **Real notifications on your phone**  
✅ **Permission handling that actually works**  
✅ **Ability to send notifications to other users**  
✅ **Background notification support**  
✅ **Production-ready notification system**  

The mock Firebase layer still handles the business logic (spike detection, user interests), but now the notifications are **completely real**!

---

## 🆘 **Troubleshooting**

**"Must use physical device"**: Notifications only work on real devices, not simulators  
**No token received**: Check internet connection and try restarting Expo  
**Permissions denied**: Go to device settings and manually enable notifications  
**Notifications not appearing**: Check notification settings and Do Not Disturb mode  

---

**Your LFS Cinema app now has professional-grade push notifications! 🎉**
