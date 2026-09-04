import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { register } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email.trim() || !username.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    const result = await register({ email: email.trim(), username: username.trim(), password });
    if (result.ok) {
      await refreshAuth();
      setLoading(false);
      router.replace('/(tabs)');
    } else {
      setLoading(false);
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Orbit</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!loading} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Choose a username" placeholderTextColor={colors.textMuted} autoCapitalize="none" autoComplete="username" editable={!loading} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 8 characters" placeholderTextColor={colors.textMuted} secureTextEntry autoCapitalize="none" autoComplete="new-password" editable={!loading} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" placeholderTextColor={colors.textMuted} secureTextEntry autoCapitalize="none" autoComplete="new-password" editable={!loading} />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Create Account</Text>}
            </Pressable>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkText}>Already have an account? <Text style={styles.linkAccent}>Sign In</Text></Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  title: { ...typography.largeTitle, color: colors.textPrimary, fontSize: 34, fontWeight: '700' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  form: { width: '100%' },
  field: { marginBottom: spacing.base },
  label: { ...typography.subhead, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: '500' },
  input: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle, borderRadius: 10, paddingHorizontal: spacing.base, paddingVertical: 14, ...typography.body, color: colors.textPrimary, minHeight: 48 },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.base, textAlign: 'center' },
  button: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 50, marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.body, color: colors.white, fontWeight: '600' },
  linkButton: { alignItems: 'center', marginTop: spacing.base, paddingVertical: spacing.sm },
  linkText: { ...typography.body, color: colors.textSecondary },
  linkAccent: { color: colors.accent, fontWeight: '600' },
});
