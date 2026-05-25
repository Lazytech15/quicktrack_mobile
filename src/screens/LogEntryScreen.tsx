import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createLog, getAllEquipment, Equipment } from '../db/queries';
import { Button, Card } from '../components/ui';
import { getTechnicianName } from '../utils/syncService';
import { colors, spacing, radius, typography } from '../utils/theme';

type RouteParams = { equipmentId?: number; equipmentName?: string };

const STATUS_OPTIONS = [
  { value: 'OK', label: 'OK', color: colors.primary },
  { value: 'Needs Attention', label: 'Needs Attention', color: colors.warning },
  { value: 'Critical', label: 'Critical', color: colors.danger },
  { value: 'Repaired', label: 'Repaired', color: colors.info },
  { value: 'Inspected', label: 'Inspected', color: colors.textSecondary },
];

export default function LogEntryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { equipmentId, equipmentName } = route.params ?? {};

  const [allEquipment] = useState<Equipment[]>(getAllEquipment());
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(equipmentId ?? null);
  const [status, setStatus] = useState('OK');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedEquipment = allEquipment.find(e => e.id === selectedEquipmentId);

  const handleAddPhoto = async () => {
    const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to capture equipment photos.');
      return;
    }

    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets[0]) {
            setPhotos(prev => [...prev, result.assets[0].uri]);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets[0]) {
            setPhotos(prev => [...prev, result.assets[0].uri]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!selectedEquipmentId) {
      Alert.alert('Select Equipment', 'Please select the equipment you are logging for.');
      return;
    }
    setSaving(true);
    try {
      const techName = await getTechnicianName();
      createLog({
        equipment_id: selectedEquipmentId,
        technician: techName,
        status,
        notes: notes.trim() || undefined,
        photos: photos.length > 0 ? JSON.stringify(photos) : undefined,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save log entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Equipment selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Equipment *</Text>
          {equipmentId ? (
            <Card style={styles.selectedEquipment}>
              <Text style={styles.selectedEquipmentName}>{equipmentName}</Text>
              <Text style={styles.selectedEquipmentLocation}>{selectedEquipment?.location}</Text>
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.equipmentScroll}>
              {allEquipment.map(eq => (
                <TouchableOpacity
                  key={eq.id}
                  style={[styles.equipmentPill, selectedEquipmentId === eq.id && styles.equipmentPillActive]}
                  onPress={() => setSelectedEquipmentId(eq.id)}
                >
                  <Text style={[styles.equipmentPillText, selectedEquipmentId === eq.id && styles.equipmentPillTextActive]} numberOfLines={1}>
                    {eq.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.label}>Status *</Text>
          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.statusBtn, status === opt.value && { backgroundColor: opt.color, borderColor: opt.color }]}
                onPress={() => setStatus(opt.value)}
              >
                {status === opt.value && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
                <Text style={[styles.statusBtnText, status === opt.value && { color: '#fff' }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Describe the equipment condition, actions taken, or observations…"
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.label}>Photos ({photos.length})</Text>
          <View style={styles.photoRow}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button title="Save Log Entry" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },

  section: {},
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, letterSpacing: 0.2 },

  selectedEquipment: { padding: 12 },
  selectedEquipmentName: { ...typography.body, fontWeight: '600' },
  selectedEquipmentLocation: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  equipmentScroll: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  equipmentPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginRight: 8, maxWidth: 180 },
  equipmentPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  equipmentPillText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  equipmentPillTextActive: { color: '#fff' },

  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  statusBtnText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },

  textarea: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 15, color: colors.textPrimary, minHeight: 100 },

  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoWrapper: { position: 'relative' },
  photo: { width: 90, height: 70, borderRadius: radius.sm },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: 90, height: 70, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, gap: 3 },
  addPhotoText: { fontSize: 11, color: colors.primary, fontWeight: '500' },

  saveBtn: { marginTop: spacing.sm },
});
