import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Alert, Platform, Linking, ScrollView, TouchableOpacity } from 'react-native';
import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

PushNotification.configure({
  onNotification: function (notification) {
    // Optional: handle notification
  },
  requestPermissions: Platform.OS === 'ios',
});

const Stack = createStackNavigator();

const HomeScreen = ({ navigation, notifications, badgeCount }) => (
  <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
    <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>Welcome to WhatsAppClone!</Text>
    <Text style={{ fontSize: 18, margin: 10 }}>🔔 Notifications: {badgeCount}</Text>
    <Text style={{ fontSize: 16, marginVertical: 10, fontWeight: 'bold' }}>Notification History:</Text>
    {notifications.length === 0 ? (
      <Text style={{ color: 'gray' }}>No notifications yet.</Text>
    ) : (
      notifications.map((n, i) => (
        <TouchableOpacity
          key={i}
          style={{ marginVertical: 8, padding: 10, backgroundColor: '#f2f2f2', borderRadius: 8, width: '100%' }}
          onPress={() => navigation.navigate('Details', { notification: n })}
        >
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{n.title}</Text>
          <Text style={{ fontSize: 15 }}>{n.body}</Text>
          <Text style={{ fontSize: 11, color: 'gray', marginTop: 4 }}>{new Date(n.date).toLocaleString()}</Text>
        </TouchableOpacity>
      ))
    )}
  </ScrollView>
);

const DetailsScreen = ({ route }) => {
  const { notification } = route.params || {};
  if (!notification) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No notification data.</Text></View>;
  }
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>Notification Details</Text>
      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{notification.title}</Text>
      <Text style={{ fontSize: 15 }}>{notification.body}</Text>
      <Text style={{ fontSize: 11, color: 'gray', marginTop: 4 }}>{new Date(notification.date).toLocaleString()}</Text>
    </View>
  );
};

const App = () => {
  const [notifications, setNotifications] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const navigationRef = useRef();

  useEffect(() => {
    async function requestNotificationPermission() {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        if (result !== RESULTS.GRANTED) {
          const reqResult = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
          if (reqResult !== RESULTS.GRANTED) {
            Alert.alert(
              'Permission Required',
              'Please enable notifications in system settings to receive alerts.',
              [
                { text: 'Open Settings', onPress: () => openSettings() },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
        }
      } else {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;
        if (!enabled) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in system settings to receive alerts.'
          );
        }
      }
    }

    requestNotificationPermission();

    // Load notifications from storage
    AsyncStorage.getItem('notifications').then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        setNotifications(parsed);
        setBadgeCount(parsed.length);
        PushNotification.setApplicationIconBadgeNumber(parsed.length);
      }
    });

    // Clear badge when app is opened
    PushNotification.setApplicationIconBadgeNumber(0);
    setBadgeCount(0);

    // Get the device FCM token
    messaging()
      .getToken()
      .then(token => {
        console.log('FCM Token:', token);
      });

    // Foreground notification handler
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const title = remoteMessage.notification?.title || 'Notification';
      const body = remoteMessage.notification?.body || 'You have a new message!';
      const newNotification = { title, body, date: new Date().toISOString() };
      const updatedNotifications = [newNotification, ...notifications];
      setNotifications(updatedNotifications);
      setBadgeCount(updatedNotifications.length);
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      PushNotification.setApplicationIconBadgeNumber(updatedNotifications.length);
      Alert.alert(title, body, [
        {
          text: 'View',
          onPress: () => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Details', { notification: newNotification });
            }
          },
        },
        { text: 'OK' },
      ]);
    });

    // Background/quit notification tap handler
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage) {
        const title = remoteMessage.notification?.title || 'Notification';
        const body = remoteMessage.notification?.body || 'You have a new message!';
        const newNotification = { title, body, date: new Date().toISOString() };
        if (navigationRef.current) {
          navigationRef.current.navigate('Details', { notification: newNotification });
        }
      }
    });

    // App launched from quit state by tapping notification
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        const title = remoteMessage.notification?.title || 'Notification';
        const body = remoteMessage.notification?.body || 'You have a new message!';
        const newNotification = { title, body, date: new Date().toISOString() };
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('Details', { notification: newNotification });
          }
        }, 1000); // Wait for navigation to be ready
      }
    });

    return () => {
      unsubscribe();
      unsubscribeNotificationOpened();
    };
  }, [notifications]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" options={{ title: 'WhatsAppClone' }}>
          {props => <HomeScreen {...props} notifications={notifications} badgeCount={badgeCount} />}
        </Stack.Screen>
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;