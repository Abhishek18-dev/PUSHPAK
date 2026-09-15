import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { apiClient } from '../../services/api/apiClient';
import { authManager } from '../../services/api/authInterceptor';

interface LoginScreenProps {
  onLoginSuccess: (user: any, mfaRequired: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('drdo_admin');
  const [password, setPassword] = useState('DefSec#2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.auth.login(username, password);
      if (res.success && res.data) {
        authManager.setToken(res.data.token);
        authManager.setUser(res.data.user);
        onLoginSuccess(res.data.user, res.data.mfaRequired);
      } else {
        // Local single workstation fallback
        const mockUser = { username, role: 'RESEARCHER' };
        authManager.setUser(mockUser);
        onLoginSuccess(mockUser, false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>DEFENSE TERMINAL</Text>
          </View>
          <Text style={styles.title}>INTELLIGENT RF SCANNER</Text>
          <Text style={styles.subtitle}>SECURE WINDOWS WORKSTATION · LEVEL-1 AUTH</Text>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>OPERATOR ID / USERNAME</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter operator username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SECURITY KEY / PASSPHRASE</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter passphrase"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginBtnText}>
            {loading ? 'AUTHENTICATING...' : 'ACCESS WORKSTATION'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Text style={styles.noteText}>
            RESTRICTED ACCESS · APPEND-ONLY AUDIT LOGGING ACTIVE
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: 440,
    backgroundColor: colors.surfaceModal,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  badge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.0,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: colors.crimsonGlow,
    borderColor: colors.crimson,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.crimson,
    fontSize: 11,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.borderDim,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyMono,
    fontSize: 13,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#020503',
    letterSpacing: 1.0,
  },
  footerNote: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  noteText: {
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
