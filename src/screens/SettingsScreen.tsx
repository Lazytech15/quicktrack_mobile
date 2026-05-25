import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Alert, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getPendingSyncCount } from '../db/queries';
import { getApiUrl, setApiUrl, getTechnicianName, setTechnicianName } from '../utils/syncService';
import { registerForPushNotifications, scheduleDailyReminder } from '../utils/notifications';
import { Button, Card, SectionLabel } from '../components/ui';
import { useNetworkSync } from '../hooks/useNetworkSync';
import { colors, spacing, radius, fs, rs } from '../utils/theme';

export default function SettingsScreen() {
  const { isConnected, isSyncing, lastSyncTime, checkAndSync } = useNetworkSync();

  const [techName, setTechNameState] = useState('');
  const [apiUrl, setApiUrlState] = useState('');
  const [pendingSync, setPendingSync] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const name = await getTechnicianName();
      const url = await getApiUrl();
      const notif = await AsyncStorage.getItem('notifications_enabled');
      setTechNameState(name);
      setApiUrlState(url);
      setNotifEnabled(notif === 'true');
      setPendingSync(getPendingSyncCount());
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await setTechnicianName(techName.trim() || 'Field Technician');
    await setApiUrl(apiUrl.trim());
    setSaving(false);
    Alert.alert('Saved', 'Settings updated successfully.');
  };

  const handleForceSync = async () => {
    await checkAndSync();
    setPendingSync(getPendingSyncCount());
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotifEnabled(val);
    await AsyncStorage.setItem('notifications_enabled', String(val));
    if (val) {
      const token = await registerForPushNotifications();
      if (token) {
        await scheduleDailyReminder();
        Alert.alert('Notifications On', 'You will receive daily reminders and overdue alerts.');
      } else {
        setNotifEnabled(false);
        await AsyncStorage.setItem('notifications_enabled', 'false');
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
      }
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Technician */}
      <View style={styles.section}>
        <SectionLabel label="Technician" />
        <Card>
          <Text style={styles.fieldLabel}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={techName}
            onChangeText={setTechNameState}
            placeholder="Field Technician"
            placeholderTextColor={colors.textTertiary}
          />
        </Card>
      </View>

      {/* Sync */}
      <View style={styles.section}>
        <SectionLabel label="Sync & API" />
        <Card style={styles.syncCard}>
          <View style={styles.syncRow}>
            <View style={[styles.syncDotWrap, { backgroundColor: isConnected ? colors.primaryBg : '#F1EFE8' }]}>
              <View style={[styles.syncDot, { backgroundColor: isConnected ? colors.primaryLight : colors.textTertiary }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncStatusText}>{isConnected ? 'Connected' : 'Offline'}</Text>
              {lastSyncTime && (
                <Text style={styles.lastSync}>Last synced {lastSyncTime.toLocaleTimeString()}</Text>
              )}
            </View>
            {pendingSync > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingSync} pending</Text>
              </View>
            )}
          </View>
          <Button
            title={isSyncing ? 'Syncing…' : 'Sync Now'}
            variant="secondary"
            onPress={handleForceSync}
            loading={isSyncing}
            disabled={!isConnected}
            icon={<Ionicons name="sync-outline" size={rs(16)} color={colors.textPrimary} />}
          />
        </Card>

        <Card style={{ marginTop: spacing.sm }}>
          <Text style={styles.fieldLabel}>API Base URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrlState}
            placeholder="https://api.yourcompany.com/v1"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="url"
          />
        </Card>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <SectionLabel label="Notifications" />
        <Card>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="notifications-outline" size={rs(20)} color={colors.primary} />
            </View>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingSubtitle}>Daily reminders & overdue alerts</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor="#fff"
            />
          </View>
        </Card>
      </View>

      {/* About */}
      <View style={styles.section}>
        <SectionLabel label="About" />
        <Card>
          {[
            { icon: 'phone-portrait-outline', label: 'App', value: 'QuickTrack Mobile' },
            { icon: 'code-slash-outline', label: 'Version', value: '1.0.0' },
            { icon: 'construct-outline', label: 'Built with', value: 'React Native · Expo' },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.aboutRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.aboutIconWrap}>
                <Ionicons name={row.icon as any} size={rs(16)} color={colors.textSecondary} />
              </View>
              <Text style={styles.aboutLabel}>{row.label}</Text>
              <Text style={styles.aboutValue}>{row.value}</Text>
            </View>
          ))}
        </Card>
      </View>

      <Button title="Save Settings" onPress={handleSave} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: rs(40), gap: spacing.md },

  section: { gap: spacing.sm },

  fieldLabel: { fontSize: fs(12), fontWeight: '600', color: colors.textTertiary, letterSpacing: 0.4, marginBottom: rs(7) },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: rs(12), paddingVertical: rs(11),
    fontSize: fs(15), color: colors.textPrimary, backgroundColor: colors.background,
    minHeight: rs(46),
  },

  syncCard: { gap: spacing.md },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  syncDotWrap: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    alignItems: 'center', justifyContent: 'center',
  },
  syncDot: { width: rs(10), height: rs(10), borderRadius: rs(5) },
  syncStatusText: { fontSize: fs(15), fontWeight: '600', color: colors.textPrimary },
  pendingBadge: {
    backgroundColor: colors.warningBg, paddingHorizontal: rs(10),
    paddingVertical: rs(4), borderRadius: radius.full,
  },
  pendingBadgeText: { fontSize: fs(12), fontWeight: '600', color: colors.warning },
  lastSync: { fontSize: fs(12), color: colors.textTertiary, marginTop: rs(2) },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  settingIconWrap: {
    width: rs(38), height: rs(38), borderRadius: rs(10),
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  settingLeft: { flex: 1 },
  settingTitle: { fontSize: fs(15), fontWeight: '500', color: colors.textPrimary },
  settingSubtitle: { fontSize: fs(12), color: colors.textTertiary, marginTop: rs(2) },

  aboutRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    paddingVertical: rs(10), borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  aboutIconWrap: {
    width: rs(30), height: rs(30), borderRadius: rs(8),
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  aboutLabel: { flex: 1, fontSize: fs(14), color: colors.textSecondary },
  aboutValue: { fontSize: fs(14), fontWeight: '500', color: colors.textPrimary },
});
