import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { login } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login({ email: email.trim(), password });
    if (result.ok) {
      await refreshAuth();
      setLoading(false);
      router.replace('/(tabs)');
    } else {
      setLoading(false);
      setError(result.error || 'Login failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Orbit</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoComplete="email" editable={!loading} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Your password" placeholderTextColor={colors.textMuted} secureTextEntry autoCapitalize="none" autoComplete="password" editable={!loading} />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Sign In</Text>}
            </Pressable>
            <Link href="/(auth)/register" asChild>
              <Pressable style={styles.linkButton}>
                <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkAccent}>Sign Up</Text></Text>
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
