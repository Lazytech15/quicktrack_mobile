import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getAllEquipment, getOverdueEquipment, getPendingSyncCount, Equipment } from '../db/queries';
import { Card, StatusBadge, SyncBanner, SectionLabel } from '../components/ui';
import { colors, spacing, typography, fs, rs } from '../utils/theme';
import { useNetworkSync } from '../hooks/useNetworkSync';
import { scheduleOverdueNotifications } from '../utils/notifications';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { isConnected, isSyncing, lastSyncTime } = useNetworkSync();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [overdue, setOverdue] = useState<Equipment[]>([]);
  const [pendingSync, setPendingSync] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    const all = getAllEquipment();
    const due = getOverdueEquipment();
    const pending = getPendingSyncCount();
    setEquipment(all);
    setOverdue(due);
    setPendingSync(pending);
    if (due.length > 0) scheduleOverdueNotifications();
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const statusCounts = equipment.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: 'Total', value: equipment.length, color: colors.textPrimary, bg: colors.surface },
    { label: 'Active', value: statusCounts.active ?? 0, color: colors.primary, bg: colors.primaryBg },
    { label: 'Overdue', value: overdue.length, color: overdue.length > 0 ? colors.danger : colors.textTertiary, bg: overdue.length > 0 ? colors.dangerBg : colors.surface },
    { label: 'Pending', value: pendingSync, color: pendingSync > 0 ? colors.warning : colors.textTertiary, bg: pendingSync > 0 ? colors.warningBg : colors.surface },
  ];

  return (
    <View style={styles.root}>
      <SyncBanner isConnected={isConnected} isSyncing={isSyncing} pendingCount={pendingSync} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>QuickTrack</Text>
            <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          </View>
          <View style={[styles.connBadge, { backgroundColor: isConnected ? colors.primaryBg : '#F1EFE8' }]}>
            <View style={[styles.connDot, { backgroundColor: isConnected ? colors.primaryLight : colors.textTertiary }]} />
            <Text style={[styles.connText, { color: isConnected ? colors.primary : colors.textSecondary }]}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          {stats.map(stat => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.bg }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <TouchableOpacity
            style={styles.overdueAlert}
            onPress={() => navigation.navigate('Equipment', { filter: 'overdue' })}
            activeOpacity={0.8}
          >
            <View style={styles.overdueIconWrap}>
              <Ionicons name="warning" size={rs(18)} color={colors.danger} />
            </View>
            <Text style={styles.overdueText}>
              {overdue.length} equipment item{overdue.length > 1 ? 's' : ''} overdue for inspection
            </Text>
            <Ionicons name="chevron-forward" size={rs(16)} color={colors.danger} />
          </TouchableOpacity>
        )}

        {/* Recent equipment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel label="Equipment" />
            <TouchableOpacity
              onPress={() => navigation.navigate('Equipment')}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {equipment.slice(0, 4).map(item => (
            <Card
              key={item.id}
              style={styles.equipmentCard}
              onPress={() => navigation.navigate('EquipmentDetail', { id: item.id })}
            >
              <View style={styles.cardRow}>
                <View style={styles.cardLeft}>
                  <Text style={styles.equipName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={rs(12)} color={colors.textTertiary} />
                    <Text style={styles.equipLocation} numberOfLines={1}>{item.location}</Text>
                  </View>
                  {item.next_check_due && (
                    <Text style={[
                      styles.equipDue,
                      new Date(item.next_check_due) < new Date() && { color: colors.danger },
                    ]}>
                      Due {format(new Date(item.next_check_due), 'MMM d')}
                    </Text>
                  )}
                </View>
                <View style={styles.cardRight}>
                  <StatusBadge status={item.status} size="sm" />
                  <Ionicons name="chevron-forward" size={rs(15)} color={colors.textTertiary} style={{ marginTop: rs(8) }} />
                </View>
              </View>
            </Card>
          ))}

          {equipment.length === 0 && (
            <View style={styles.emptyHint}>
              <Text style={styles.emptyHintText}>No equipment yet. Tap + to add your first item.</Text>
            </View>
          )}
        </View>

        {lastSyncTime && (
          <Text style={styles.syncLabel}>
            Last synced {format(lastSyncTime, 'p')}
          </Text>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LogEntry', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={rs(28)} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: rs(100) },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  headerLeft: { flex: 1, marginRight: spacing.md },
  greeting: { ...typography.heading1 },
  date: { fontSize: fs(14), color: colors.textSecondary, marginTop: rs(3), fontWeight: '400' },
  connBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingHorizontal: rs(10), paddingVertical: rs(6),
    borderRadius: 100,
  },
  connDot: { width: rs(7), height: rs(7), borderRadius: 4 },
  connText: { fontSize: fs(12), fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1, borderRadius: rs(12), borderWidth: 1,
    borderColor: colors.border, padding: rs(12),
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  statValue: { fontSize: fs(22), fontWeight: '700', marginBottom: rs(2) },
  statLabel: { fontSize: fs(11), color: colors.textTertiary, fontWeight: '600' },

  overdueAlert: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    backgroundColor: colors.dangerBg, borderRadius: rs(12),
    padding: rs(14), marginBottom: spacing.lg,
    borderWidth: 1, borderColor: '#F5B0B0',
  },
  overdueIconWrap: {
    width: rs(32), height: rs(32), borderRadius: rs(16),
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  overdueText: { flex: 1, fontSize: fs(13), fontWeight: '500', color: colors.danger },

  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  seeAllBtn: { padding: rs(4) },
  seeAll: { fontSize: fs(13), color: colors.primary, fontWeight: '600' },

  equipmentCard: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, marginRight: spacing.md },
  cardRight: { alignItems: 'flex-end' },
  equipName: { fontSize: fs(15), fontWeight: '600', color: colors.textPrimary, marginBottom: rs(4) },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: rs(3), marginBottom: rs(3) },
  equipLocation: { fontSize: fs(13), color: colors.textSecondary, flex: 1 },
  equipDue: { fontSize: fs(12), color: colors.textTertiary, fontWeight: '500' },

  emptyHint: {
    backgroundColor: colors.surface, borderRadius: rs(12),
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center',
  },
  emptyHintText: { fontSize: fs(14), color: colors.textTertiary, textAlign: 'center', lineHeight: fs(20) },

  syncLabel: { textAlign: 'center', fontSize: fs(12), color: colors.textTertiary, marginTop: spacing.sm },

  fab: {
    position: 'absolute', bottom: rs(24), right: rs(24),
    width: rs(58), height: rs(58), borderRadius: rs(29),
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.35, shadowRadius: rs(10), elevation: 7,
  },
});
