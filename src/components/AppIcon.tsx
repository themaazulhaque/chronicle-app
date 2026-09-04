import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

interface AppIconProps { uri?: string; size?: number }

export function AppIcon({ uri, size = 44 }: AppIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: Math.min(radius.md, size / 3) }]}>
      {uri ? <Image source={{ uri }} style={{ width: size * 0.78, height: size * 0.78 }} resizeMode="contain" /> : <Ionicons name="apps-outline" size={size * 0.52} color={colors.textMuted} />}
    </View>
  );
}

const styles = StyleSheet.create({ container: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary, overflow: 'hidden' } });
