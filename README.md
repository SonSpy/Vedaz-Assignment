# WhatsAppClone – React Native Push Notification Assignment

## 📱 Overview
This is a sample React Native app built for an internship assignment. It demonstrates real-time push notifications (like WhatsApp) with support for Android 13+ (including Android 15), featuring:

- Foreground, background, and killed-state notifications
- Native Android notification handling (Java)
- Deep linking (open a specific screen from notification)
- Local notification storage (history)
- Badge count (in-app and on supported launchers)

---

## 🚀 Features
- **Minimal WhatsApp-like UI**
- **Push Notifications**: Foreground (in-app alert), background, and killed state (system notification)
- **Native Java Module**: Custom `NotificationService` for Android notification handling
- **Deep Linking**: Tap a notification to open a details screen
- **Notification History**: All received notifications are stored and viewable in-app
- **Badge Count**: Shows unread notification count in-app and on supported Android launchers

---

## 🛠️ Setup Instructions

### 1. **Clone the Repository**
```sh
git clone <your-repo-url>
cd WhatsAppClone
```

### 2. **Install Dependencies**
```sh
npm install
```

### 3. **Firebase Setup**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project
- Register your Android app (use the package name from `android/app/src/main/AndroidManifest.xml`)
- Download `google-services.json` and place it in `android/app/`
- In Firebase Console, enable Cloud Messaging

### 4. **Android Permissions**
- The app requests notification permission on Android 13+ at runtime
- Required permissions are set in `AndroidManifest.xml` (`INTERNET`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`)

### 5. **Native Modules**
- Custom Java service (`NotificationService.java`) handles notifications in all app states
- Deep linking and badge count are supported

---

## ▶️ Running the App (Android)

1. **Start an Android emulator (Google Play image) or connect a physical device**
2. **Build and run the app:**
   ```sh
   npx react-native run-android
   ```
3. **Grant notification permission** when prompted (Android 13+)

---

## 🔔 Testing Push Notifications

1. **Get your device's FCM token** (printed in Metro logs)
2. **Send a test notification from Firebase Console:**
   - Go to Cloud Messaging > Send test message
   - Paste your FCM token
   - Enter a title and body
   - Send
3. **Test in all app states:**
   - **Foreground:** In-app alert appears
   - **Background:** System notification appears
   - **Killed:** System notification appears (heads-up if possible)

---

## 🔗 Deep Linking & Notification History
- Tapping a notification (from system tray or in-app) opens a details screen with the notification content
- All received notifications are stored and viewable in the app's notification history

---

## 🔢 Badge Count
- Badge count is shown in-app and on the app icon (if supported by your launcher)
- **Note:** Most Android launchers only show a dot, not a number. This is a system limitation.

---

## ⚠️ Notes & Troubleshooting
- **Emulator:** Use a Google Play image and sign in to Google for FCM to work in killed state
- **Heads-up notifications:** Not guaranteed in killed state (Android system policy)
- **Permissions:** Notifications are blocked by default on Android 13+ until user grants permission
- **If notifications don't appear:**
  - Check notification permission in system settings
  - Uninstall/reinstall the app to reset notification channels
  - Check Firebase setup and `google-services.json` placement

---

## 🎥 Demo Video Submission
- Record a video showing:
  - App receiving notifications in all states
  - Deep linking (notification tap opens details)
  - Notification history and badge count
- Upload to the provided Google Drive link, named with your full name

---

## 👤 Credits
- Assignment by [Your Name]
- Built for [Company/Internship Name] React Native App Development Internship

---

**Feel free to reach out if you have any questions or issues!**
