import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getEquipmentById, getLogsForEquipment, Equipment, EquipmentLog } from '../db/queries';
import { StatusBadge, Button, Card, SectionLabel } from '../components/ui';
import { generateEquipmentReport } from '../utils/pdfGenerator';
import { colors, spacing, typography, radius, fs, rs } from '../utils/theme';

type RouteParams = { id: number };

export default function EquipmentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { id } = route.params;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useFocusEffect(useCallback(() => {
    const eq = getEquipmentById(id);
    const ls = getLogsForEquipment(id);
    setEquipment(eq);
    setLogs(ls);
  }, [id]));

  if (!equipment) return null;

  const isOverdue = equipment.next_check_due
    ? new Date(equipment.next_check_due) < new Date()
    : false;

  const handleExportPdf = async () => {
    setGeneratingPdf(true);
    try {
      await generateEquipmentReport(equipment, logs);
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF report.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleLogEntry = () => {
    navigation.navigate('LogEntry', { equipmentId: id, equipmentName: equipment.name });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons name="cube-outline" size={rs(26)} color={colors.primary} />
            </View>
            <StatusBadge status={equipment.status} />
          </View>
          <Text style={styles.equipName}>{equipment.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={rs(14)} color={colors.textTertiary} />
            <Text style={styles.equipLocation}>{equipment.location}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaGrid}>
            {[
              { label: 'Category', value: equipment.category },
              { label: 'Serial #', value: equipment.serial_number ?? '—' },
              {
                label: 'Last Checked',
                value: equipment.last_checked ? format(new Date(equipment.last_checked), 'MMM d, yyyy') : 'Never',
              },
              {
                label: 'Next Due',
                value: equipment.next_check_due ? format(new Date(equipment.next_check_due), 'MMM d, yyyy') : '—',
                danger: isOverdue,
              },
            ].map(m => (
              <View key={m.label} style={styles.metaItem}>
                <Text style={styles.metaLabel}>{m.label}</Text>
                <Text style={[styles.metaValue, m.danger && { color: colors.danger }]}>{m.value}</Text>
              </View>
            ))}
          </View>

          {equipment.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{equipment.notes}</Text>
            </View>
          )}
        </Card>

        {/* Overdue alert */}
        {isOverdue && (
          <View style={styles.overdueBox}>
            <View style={styles.overdueIconWrap}>
              <Ionicons name="warning" size={rs(18)} color={colors.danger} />
            </View>
            <Text style={styles.overdueText}>Inspection overdue — log an entry to clear this.</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Log Entry"
            onPress={handleLogEntry}
            icon={<Ionicons name="create-outline" size={rs(17)} color="#fff" />}
            style={{ flex: 1 }}
          />
          <Button
            title="PDF Report"
            onPress={handleExportPdf}
            variant="secondary"
            loading={generatingPdf}
            icon={<Ionicons name="document-text-outline" size={rs(17)} color={colors.textPrimary} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Logs */}
        <View style={styles.section}>
          <SectionLabel label={`Service Logs (${logs.length})`} />
          {logs.length === 0 && (
            <View style={styles.emptyLogs}>
              <Ionicons name="clipboard-outline" size={rs(32)} color={colors.border} />
              <Text style={styles.noLogs}>No logs yet</Text>
              <Text style={styles.noLogsHint}>Tap "Log Entry" to record the first check.</Text>
            </View>
          )}
          {logs.map(log => (
            <LogCard key={log.id} log={log} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const LogCard: React.FC<{ log: EquipmentLog }> = ({ log }) => {
  const photos: string[] = log.photos ? JSON.parse(log.photos) : [];
  return (
    <Card style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.logAvatar}>
          <Text style={styles.logAvatarText}>{log.technician.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.logTech}>{log.technician}</Text>
          <Text style={styles.logDate}>{format(new Date(log.created_at), 'PPp')}</Text>
        </View>
        <View style={styles.logStatus}>
          <Text style={styles.logStatusText}>{log.status}</Text>
        </View>
      </View>
      {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photo} />
          ))}
        </ScrollView>
      )}
      <View style={styles.logFooter}>
        <Ionicons
          name={log.synced ? 'checkmark-circle' : 'time-outline'}
          size={rs(13)}
          color={log.synced ? colors.primaryLight : colors.textTertiary}
        />
        <Text style={[styles.logSyncText, { color: log.synced ? colors.primaryLight : colors.textTertiary }]}>
          {log.synced ? 'Synced' : 'Pending sync'}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: rs(40), gap: spacing.md },

  headerCard: {},
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: rs(12),
  },
  headerIcon: {
    width: rs(52), height: rs(52), borderRadius: radius.lg,
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  equipName: { ...typography.heading2, marginBottom: rs(5) },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  equipLocation: { fontSize: fs(14), color: colors.textSecondary },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(14) },
  metaItem: { width: '46%' },
  metaLabel: {
    fontSize: fs(11), fontWeight: '700', color: colors.textTertiary,
    letterSpacing: 0.5, marginBottom: rs(3), textTransform: 'uppercase',
  },
  metaValue: { fontSize: fs(14), fontWeight: '500', color: colors.textPrimary },
  notesBox: {
    marginTop: spacing.md, backgroundColor: colors.background,
    borderRadius: radius.sm, padding: rs(12),
    borderLeftWidth: rs(3), borderLeftColor: colors.border,
  },
  notesText: { fontSize: fs(13), color: colors.textSecondary, lineHeight: fs(19) },

  overdueBox: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    backgroundColor: colors.dangerBg, borderRadius: radius.md,
    padding: rs(14), borderWidth: 1, borderColor: '#F5B0B0',
  },
  overdueIconWrap: {
    width: rs(34), height: rs(34), borderRadius: rs(17),
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  overdueText: { flex: 1, fontSize: fs(13), color: colors.danger, fontWeight: '500', lineHeight: fs(19) },

  actions: { flexDirection: 'row', gap: spacing.sm },

  section: {},
  emptyLogs: { alignItems: 'center', paddingVertical: spacing.xxl, gap: rs(6) },
  noLogs: { fontSize: fs(15), fontWeight: '600', color: colors.textSecondary },
  noLogsHint: { fontSize: fs(13), color: colors.textTertiary },

  logCard: { marginBottom: spacing.sm },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(10), marginBottom: rs(10) },
  logAvatar: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  logAvatarText: { fontSize: fs(15), fontWeight: '700', color: colors.primary },
  logTech: { fontSize: fs(14), fontWeight: '600', color: colors.textPrimary },
  logDate: { fontSize: fs(12), color: colors.textTertiary, marginTop: rs(1) },
  logStatus: {
    backgroundColor: colors.primaryBg, paddingHorizontal: rs(10),
    paddingVertical: rs(4), borderRadius: radius.full,
  },
  logStatusText: { fontSize: fs(12), fontWeight: '600', color: colors.primary },
  logNotes: { fontSize: fs(13), color: colors.textSecondary, lineHeight: fs(19), marginBottom: rs(10) },
  photos: { marginBottom: rs(10) },
  photo: { width: rs(100), height: rs(75), borderRadius: radius.sm, marginRight: rs(6) },
  logFooter: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  logSyncText: { fontSize: fs(11), fontWeight: '500' },
});
