import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createEquipment } from '../db/queries';
import { Button, Card } from '../components/ui';
import { colors, spacing, radius, fs, rs } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['HVAC', 'Electrical', 'Plumbing', 'Safety', 'Mechanical', 'Other'];
const STATUSES = ['active', 'maintenance', 'offline'] as const;

const STATUS_META: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  active: { color: colors.primary, bg: colors.primaryBg, icon: 'checkmark-circle-outline' },
  maintenance: { color: colors.warning, bg: colors.warningBg, icon: 'construct-outline' },
  offline: { color: colors.danger, bg: colors.dangerBg, icon: 'power-outline' },
};

export default function AddEquipmentScreen() {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [serial, setSerial] = useState('');
  const [category, setCategory] = useState('HVAC');
  const [status, setStatus] = useState<'active' | 'maintenance' | 'offline'>('active');
  const [notes, setNotes] = useState('');
  const [nextCheckDue, setNextCheckDue] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !location.trim()) {
      Alert.alert('Required fields', 'Please enter equipment name and location.');
      return;
    }
    setSaving(true);
    try {
      createEquipment({
        name: name.trim(),
        location: location.trim(),
        serial_number: serial.trim() || undefined,
        category,
        status,
        notes: notes.trim() || undefined,
        next_check_due: nextCheckDue?.toISOString(),
        last_checked: undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save equipment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Basic Info</Text>
          <Field label="Equipment Name *" value={name} onChangeText={setName} placeholder="e.g. Air Compressor Unit A1" />
          <Field label="Location *" value={location} onChangeText={setLocation} placeholder="e.g. Building 3 – Floor 2" />
          <Field label="Serial Number" value={serial} onChangeText={setSerial} placeholder="Optional" />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Category</Text>
          <View style={styles.pillRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, category === cat && styles.pillActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Initial Status</Text>
          <View style={styles.statusRow}>
            {STATUSES.map(s => {
              const meta = STATUS_META[s];
              const active = status === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusCard, active && { backgroundColor: meta.bg, borderColor: meta.color }]}
                  onPress={() => setStatus(s)}
                >
                  <Ionicons name={meta.icon} size={rs(20)} color={active ? meta.color : colors.textTertiary} />
                  <Text style={[styles.statusCardText, active && { color: meta.color }]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <Text style={styles.fieldLabel}>Next Check Due</Text>
          <TouchableOpacity
            style={[styles.dateBtn, nextCheckDue && { borderColor: colors.primary }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={rs(18)}
              color={nextCheckDue ? colors.primary : colors.textTertiary}
            />
            <Text style={[styles.dateBtnText, !nextCheckDue && { color: colors.textTertiary }]}>
              {nextCheckDue ? nextCheckDue.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select date…'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={nextCheckDue ?? new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setNextCheckDue(date);
              }}
            />
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Any important notes about this equipment…"
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Card>

        <Button title="Add Equipment" onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Field: React.FC<{
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
}> = ({ label, value, onChangeText, placeholder }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: rs(40) },

  card: { gap: spacing.md },
  cardTitle: {
    fontSize: fs(13), fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.4, marginBottom: rs(-4),
  },

  fieldGroup: {},
  fieldLabel: { fontSize: fs(12), fontWeight: '600', color: colors.textTertiary, letterSpacing: 0.4, marginBottom: rs(7) },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: rs(12), paddingVertical: rs(11),
    fontSize: fs(15), color: colors.textPrimary, backgroundColor: colors.background,
    minHeight: rs(46),
  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  pill: {
    paddingHorizontal: rs(14), paddingVertical: rs(8),
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.background,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: fs(13), fontWeight: '500', color: colors.textSecondary },
  pillTextActive: { color: '#fff' },

  statusRow: { flexDirection: 'row', gap: rs(8) },
  statusCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: rs(6), paddingVertical: rs(14),
    borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.background,
  },
  statusCardText: { fontSize: fs(12), fontWeight: '600', color: colors.textTertiary },

  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: rs(12), paddingVertical: rs(11),
    backgroundColor: colors.background, minHeight: rs(46),
  },
  dateBtnText: { fontSize: fs(15), color: colors.textPrimary },

  textarea: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: rs(12), paddingVertical: rs(11),
    fontSize: fs(15), color: colors.textPrimary,
    backgroundColor: colors.background, minHeight: rs(90),
  },
});
