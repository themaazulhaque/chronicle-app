import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { UpdateInfo, getDownloadUrl } from '../services/updateService';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  onDismiss: () => void;
}

export function UpdateModal({ visible, updateInfo, onDismiss }: UpdateModalProps) {
  if (!updateInfo) return null;

  const handleUpdate = async () => {
    const url = getDownloadUrl();
    try {
      await Linking.openURL(url);
    } catch {
      // fallback
    }
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="arrow-up-circle" size={48} color={colors.accent} />
          </View>
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.version}>Orbit {updateInfo.latestVersionName}</Text>
          {updateInfo.releaseNotes.length > 0 && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesHeader}>What's New</Text>
              {updateInfo.releaseNotes.map((note, i) => (
                <Text key={i} style={styles.noteItem}>• {note}</Text>
              ))}
            </View>
          )}
          <View style={styles.buttonRow}>
            <Pressable style={styles.laterButton} onPress={onDismiss}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
            <Pressable style={styles.updateButton} onPress={handleUpdate}>
              <Text style={styles.updateText}>Update Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    ...typography.title2,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  version: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  notesContainer: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
  },
  notesHeader: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  noteItem: {
    ...typography.subhead,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  laterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  laterText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  updateButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  updateText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.white,
  },
});
