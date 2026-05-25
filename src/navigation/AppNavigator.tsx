import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

import DashboardScreen from '../screens/DashboardScreen';
import EquipmentListScreen from '../screens/EquipmentListScreen';
import EquipmentDetailScreen from '../screens/EquipmentDetailScreen';
import LogEntryScreen from '../screens/LogEntryScreen';
import AddEquipmentScreen from '../screens/AddEquipmentScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0 },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontSize: 17, fontWeight: '600' as const },
  cardStyle: { backgroundColor: colors.background },
};

function EquipmentStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Equipment" component={EquipmentListScreen} options={{ title: 'Equipment' }} />
      <Stack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="AddEquipment" component={AddEquipmentScreen} options={{ title: 'Add Equipment' }} />
      <Stack.Screen name="LogEntry" component={LogEntryScreen} options={{ title: 'New Log Entry' }} />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'QuickTrack' }} />
      <Stack.Screen name="Equipment" component={EquipmentListScreen} options={{ title: 'Equipment' }} />
      <Stack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="LogEntry" component={LogEntryScreen} options={{ title: 'New Log Entry' }} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home: ['home', 'home-outline'],
            EquipmentTab: ['layers', 'layers-outline'],
            Settings: ['settings', 'settings-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['help', 'help-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="EquipmentTab" component={EquipmentStack} options={{ title: 'Equipment' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, headerStyle: { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0 }, headerTitleStyle: { fontSize: 17, fontWeight: '600' }, title: 'Settings' }} />
    </Tab.Navigator>
  );
}
