import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getAllEquipment, getOverdueEquipment, Equipment } from '../db/queries';
import { StatusBadge, EmptyState } from '../components/ui';
import { colors, spacing, typography, radius, fs, rs } from '../utils/theme';

type RouteParams = { filter?: string };

const CATEGORIES = ['All', 'HVAC', 'Electrical', 'Plumbing', 'Safety', 'Mechanical'];

export default function EquipmentListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOverdueOnly, setShowOverdueOnly] = useState(route.params?.filter === 'overdue');

  useFocusEffect(useCallback(() => {
    const all = showOverdueOnly ? getOverdueEquipment() : getAllEquipment();
    setEquipment(all);
  }, [showOverdueOnly]));

  const filtered = equipment.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const isOverdue = (e: Equipment) =>
    e.next_check_due ? new Date(e.next_check_due) < new Date() : false;

  const renderItem = ({ item }: { item: Equipment }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('EquipmentDetail', { id: item.id })}
      activeOpacity={0.7}
    >
      <View style={[styles.itemIcon, isOverdue(item) && styles.itemIconOverdue]}>
        <Ionicons
          name={categoryIcon(item.category)}
          size={rs(20)}
          color={isOverdue(item) ? colors.danger : colors.primary}
        />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemLocation} numberOfLines={1}>{item.location}</Text>
        {item.next_check_due && (
          <Text style={[styles.itemDue, isOverdue(item) && { color: colors.danger }]}>
            {isOverdue(item) ? 'Overdue · ' : 'Due '}
            {format(new Date(item.next_check_due), 'MMM d, yyyy')}
          </Text>
        )}
      </View>
      <View style={styles.itemRight}>
        <StatusBadge status={item.status} size="sm" />
        <Ionicons name="chevron-forward" size={rs(15)} color={colors.textTertiary} style={{ marginTop: rs(8) }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={rs(17)} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search equipment or location…"
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={rs(17)} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, showOverdueOnly && styles.filterChipActive]}
          onPress={() => setShowOverdueOnly(!showOverdueOnly)}
        >
          <Ionicons name="warning-outline" size={rs(13)} color={showOverdueOnly ? '#fff' : colors.danger} />
          <Text style={[styles.filterChipText, showOverdueOnly && styles.filterChipTextActive]}>Overdue</Text>
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No equipment found"
            subtitle="Try adjusting your search or filters."
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Add button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEquipment')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={rs(28)} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const categoryIcon = (cat: string): keyof typeof Ionicons.glyphMap => {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    HVAC: 'thermometer-outline',
    Electrical: 'flash-outline',
    Plumbing: 'water-outline',
    Safety: 'shield-checkmark-outline',
    Mechanical: 'settings-outline',
  };
  return map[cat] ?? 'cube-outline';
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    margin: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: rs(14), height: rs(46),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: fs(15), color: colors.textPrimary },

  filters: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: rs(8), marginBottom: spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingHorizontal: rs(12), paddingVertical: rs(7),
    borderRadius: radius.full, borderWidth: 1.5,
    borderColor: colors.danger, backgroundColor: colors.dangerBg,
  },
  filterChipActive: { backgroundColor: colors.danger },
  filterChipText: { fontSize: fs(12), fontWeight: '600', color: colors.danger },
  filterChipTextActive: { color: '#fff' },

  categories: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: rs(6) },
  catPill: {
    paddingHorizontal: rs(16), paddingVertical: rs(8),
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  catPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: fs(13), fontWeight: '500', color: colors.textSecondary },
  catTextActive: { color: '#fff' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: rs(100) },
  separator: { height: 1, backgroundColor: colors.border },

  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, paddingVertical: rs(14),
    paddingHorizontal: 0, gap: rs(12),
  },
  itemIcon: {
    width: rs(44), height: rs(44), borderRadius: radius.md,
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  itemIconOverdue: { backgroundColor: colors.dangerBg },
  itemBody: { flex: 1 },
  itemName: { fontSize: fs(15), fontWeight: '600', color: colors.textPrimary, marginBottom: rs(3) },
  itemLocation: { fontSize: fs(13), color: colors.textSecondary, marginBottom: rs(3) },
  itemDue: { fontSize: fs(12), color: colors.textTertiary, fontWeight: '500' },
  itemRight: { alignItems: 'flex-end' },

  fab: {
    position: 'absolute', bottom: rs(24), right: rs(24),
    width: rs(58), height: rs(58), borderRadius: rs(29),
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: rs(3) },
    shadowOpacity: 0.18, shadowRadius: rs(8), elevation: 5,
  },
});
