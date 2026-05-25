import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getOverdueEquipment } from '../db/queries';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('overdue-checks', {
      name: 'Overdue Equipment Checks',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E24B4A',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
};

export const scheduleOverdueNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const overdue = getOverdueEquipment();
  if (overdue.length === 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${overdue.length} Overdue Equipment Check${overdue.length > 1 ? 's' : ''}`,
      body: overdue.length === 1
        ? `${overdue[0].name} requires immediate attention.`
        : `Includes: ${overdue.slice(0, 2).map(e => e.name).join(', ')}${overdue.length > 2 ? ` and ${overdue.length - 2} more` : ''}.`,
      data: { screen: 'overdue' },
      sound: true,
    },
    trigger: null,
  });
};

export const scheduleDailyReminder = async (): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'QuickTrack Daily Check',
      body: 'Review your equipment schedule for today.',
      sound: true,
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: true,
    } as Notifications.DailyTriggerInput,
  });
};
