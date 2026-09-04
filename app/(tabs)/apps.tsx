import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { usageTrackingService } from '../../src/services/usageTrackingService';
import { AppInfo, UsageSnapshot } from '../../src/types';
import { AppRow } from '../../src/components/AppRow';
import { SearchInput } from '../../src/components/SearchInput';
import { EmptyState } from '../../src/components/EmptyState';

export default function AppsScreen() {
  const router = useRouter();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); const result = await usageTrackingService.getApps(); setApps(result.apps); setSnapshot(result.snapshot); setLoading(false); }, []);
  useEffect(() => { refresh(); return usageTrackingService.subscribeToForeground(refresh); }, [refresh]);
  const filteredApps = useMemo(() => { const query = searchQuery.trim().toLowerCase(); return apps.filter(app => !query || app.name.toLowerCase().includes(query) || app.packageName.toLowerCase().includes(query)); }, [apps, searchQuery]);
  const unavailable = snapshot && snapshot.capability !== 'available' && snapshot.capability !== 'no-data' && snapshot.installedApps.length === 0;

  return <SafeAreaView style={styles.container} edges={['top']}>
    <View style={styles.header}><Text style={styles.largeTitle}>Apps</Text></View>
    <SearchInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search installed apps" />
    {loading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : unavailable ? <EmptyState icon="grid-outline" title="Installed apps unavailable" message="Installed app information requires the Chronicle Android build." /> : <>
      {!searchQuery.trim() && <Text style={styles.sectionLabel}>ALL APPS</Text>}
      <FlatList data={filteredApps} keyExtractor={item => item.id} contentContainerStyle={styles.listContent} ListEmptyComponent={<EmptyState icon="search-outline" title="No results" message="No installed apps match your search." />} renderItem={({ item }) => <AppRow app={item} onPress={() => router.push(`/app/${item.id}`)} />} ItemSeparatorComponent={() => <View style={styles.separator} />} />
    </>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xs }, largeTitle: { ...typography.largeTitle, color: colors.textPrimary }, loader: { marginTop: spacing.xl }, sectionLabel: { ...typography.groupedHeader, color: colors.groupedHeader, letterSpacing: 0.5, paddingHorizontal: spacing.base, paddingBottom: spacing.sm }, listContent: { paddingBottom: spacing.section + 100, flexGrow: 1 }, separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle, marginLeft: spacing.base + 60 } });
