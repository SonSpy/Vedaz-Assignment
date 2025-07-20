import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Alert, Platform, Linking, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();
const APP_GREEN = '#25D366';
const APP_BG = '#f0f0f0';

// Configure PushNotification (outside component)
PushNotification.configure({
  onNotification: function (notification) {
    // No-op: handled in JS
  },
  requestPermissions: false,
});

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

const HomeScreen = ({ navigation, notifications, badgeCount, onClear }) => (
  <View style={styles.container}>
    <StatusBar backgroundColor={APP_GREEN} barStyle="light-content" />
    <View style={styles.appBar}>
      <Text style={styles.appBarTitle}>WhatsAppClone</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
        <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.content}>
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No notifications yet!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {notifications.map((n, i) => (
            <TouchableOpacity
              key={i}
              style={styles.bubble}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Details', { notification: n })}
            >
              <Text style={styles.bubbleTitle}>{n.title || 'No Title'}</Text>
              <Text style={styles.bubbleBody}>{n.body || 'No message'}</Text>
              <Text style={styles.bubbleTime}>{formatTime(n.timestamp)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  </View>
);

const DetailsScreen = ({ route, navigation }) => {
  const { notification } = route.params;
  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.detailsTitle}>Notification Details</Text>
      </View>
      <View style={styles.detailsCard}>
        <Text style={styles.detailsLabel}>Title:</Text>
        <Text style={styles.detailsValue}>{notification.title || 'No Title'}</Text>
        <Text style={styles.detailsLabel}>Message:</Text>
        <Text style={styles.detailsValue}>{notification.body || 'No message'}</Text>
        <Text style={styles.detailsLabel}>Received:</Text>
        <Text style={styles.detailsValue}>{formatTime(notification.timestamp)}</Text>
      </View>
    </View>
  );
};

const App = () => {
  const [notifications, setNotifications] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const navRef = useRef();

  // Log FCM token on app start
  useEffect(() => {
    messaging()
      .getToken()
      .then(token => {
        console.log('FCM Token:', token);
      });
  }, []);

  // Load notifications from storage
  useEffect(() => {
    AsyncStorage.getItem('notifications').then(data => {
      if (data) setNotifications(JSON.parse(data));
    });
  }, []);

  // Request notification permission (Android 13+)
  useEffect(() => {
    async function requestNotificationPermission() {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        if (result !== RESULTS.GRANTED) {
          const reqResult = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
          if (reqResult !== RESULTS.GRANTED) {
            Alert.alert(
              'Permission Required',
              'Please enable notification permission in settings to receive notifications.',
              [
                { text: 'Open Settings', onPress: () => openSettings() },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
        }
      } else {
        // Fallback for older Android/iOS
        requestPermission().then(authStatus => {
          const enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL;
          if (!enabled) {
            Alert.alert('Permission Required', 'Please enable notifications in system settings.');
          }
        });
      }
    }
    requestNotificationPermission();
  }, []);

  // Listen for notifications
  useEffect(() => {
    // Foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const { title, body } = remoteMessage.notification || {};
      const newNoti = {
        title,
        body,
        timestamp: Date.now(),
      };
      setNotifications(prev => {
        const updated = [newNoti, ...prev];
        AsyncStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
      setBadgeCount(prev => {
        const newCount = prev + 1;
        PushNotification.setApplicationIconBadgeNumber(newCount);
        return newCount;
      });
      Alert.alert(
        title || 'Notification',
        body || 'No message',
        [
          {
            text: 'View',
            onPress: () => {
              if (navRef.current) {
                navRef.current.navigate('Details', { notification: newNoti });
              }
            },
          },
          { text: 'OK' },
        ]
      );
    });

    // Background/killed
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      const { title, body } = remoteMessage.notification || {};
      const newNoti = {
        title,
        body,
        timestamp: Date.now(),
      };
      setNotifications(prev => {
        const updated = [newNoti, ...prev];
        AsyncStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
      setBadgeCount(prev => {
        const newCount = prev + 1;
        PushNotification.setApplicationIconBadgeNumber(newCount);
        return newCount;
      });
    });

    // Notification opened (background/killed)
    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      const { title, body } = remoteMessage.notification || {};
      const newNoti = {
        title,
        body,
        timestamp: Date.now(),
      };
      setNotifications(prev => {
        const updated = [newNoti, ...prev];
        AsyncStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
      setBadgeCount(prev => {
        const newCount = prev + 1;
        PushNotification.setApplicationIconBadgeNumber(newCount);
        return newCount;
      });
      if (navRef.current) {
        navRef.current.navigate('Details', { notification: newNoti });
      }
    });

    // App launched from quit state by notification
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        const { title, body } = remoteMessage.notification || {};
        const newNoti = {
          title,
          body,
          timestamp: Date.now(),
        };
        setNotifications(prev => {
          const updated = [newNoti, ...prev];
          AsyncStorage.setItem('notifications', JSON.stringify(updated));
          return updated;
        });
        setBadgeCount(prev => {
          const newCount = prev + 1;
          PushNotification.setApplicationIconBadgeNumber(newCount);
          return newCount;
        });
        setTimeout(() => {
          if (navRef.current) {
            navRef.current.navigate('Details', { notification: newNoti });
          }
        }, 500);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeOpened();
    };
  }, []);

  // Clear all notifications and reset badge count when app opens
  useEffect(() => {
    PushNotification.cancelAllLocalNotifications();
    PushNotification.setApplicationIconBadgeNumber(0);
  }, []);

  // Clear all notifications
  const handleClear = async () => {
    await AsyncStorage.removeItem('notifications');
    setNotifications([]);
    setBadgeCount(0);
    PushNotification.setApplicationIconBadgeNumber(0);
  };

  return (
    <NavigationContainer ref={navRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {props => (
            <HomeScreen {...props} notifications={notifications} badgeCount={badgeCount} onClear={handleClear} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BG,
  },
  appBar: {
    backgroundColor: APP_GREEN,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  appBarTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  badgeText: {
    color: APP_GREEN,
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
  },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleTitle: {
    color: APP_GREEN,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  bubbleBody: {
    color: '#222',
    fontSize: 15,
    marginBottom: 6,
  },
  bubbleTime: {
    color: '#888',
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: APP_BG,
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
    marginRight: 10,
  },
  backBtnText: {
    color: APP_GREEN,
    fontSize: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  detailsLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
  },
  detailsValue: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clearBtn: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: APP_GREEN,
  },
  clearBtnText: {
    color: APP_GREEN,
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default App;