import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// Show notifications while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register device for push notifications and save token to DB
export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;

    if (existing !== 'granted') {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      status = requested;
    }

    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Readrr',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#38B6FF',
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    await supabase
      .from('users')
      .update({ fcm_token: token })
      .eq('id', userId);
  } catch (error) {
    console.error('Push notification registration error:', error);
  }
}

// Send a push notification to a user via Expo's push service
export async function sendPushNotification(
  toUserId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('id', toUserId)
      .single();

    if (!user?.fcm_token) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        to: user.fcm_token,
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: 'high',
      }),
    });
  } catch (error) {
    console.error('Send push notification error:', error);
  }
}
