import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../src/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { focused: IoniconsName; default: IoniconsName }> = {
  index: { focused: 'time', default: 'time-outline' },
  apps: { focused: 'grid', default: 'grid-outline' },
  settings: { focused: 'settings', default: 'settings-outline' },
};

const TAB_LABELS: Record<string, string> = {
  index: 'Activity',
  apps: 'Apps',
  settings: 'Settings',
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 50 + Math.max(insets.bottom - 8, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom - 8, 0),
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: TAB_LABELS.index,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={TAB_ICONS.index[focused ? 'focused' : 'default']}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          title: TAB_LABELS.apps,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={TAB_ICONS.apps[focused ? 'focused' : 'default']}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: TAB_LABELS.settings,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={TAB_ICONS.settings[focused ? 'focused' : 'default']}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  tabBarItem: {
    paddingTop: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
