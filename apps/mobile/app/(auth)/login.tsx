import { router, type Href } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { HelperText, Text } from 'react-native-paper';

import { AuthHeader } from '@/src/features/auth/components/AuthHeader';
import { LoginForm } from '@/src/features/auth/components/LoginForm';
import { initialLoginForm } from '@/src/features/auth/types/auth.types';
import { validateLoginForm } from '@/src/features/auth/auth.validation';
import { colors } from '@/src/theme/colors';

import type { LoginForm as LoginFormState } from '@/src/features/auth/types/auth.types';

export default function LoginScreen() {
  const [form, setForm] = useState<LoginFormState>(initialLoginForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChangeField(field: keyof LoginFormState, value: string) {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    const validationError = validateLoginForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    // TODO: conectar con POST /api/auth/login cuando el backend exista.
    setLoading(false);
  }

  function handleForgotPassword() {
    router.push('/forgot-password' as Href);
  }

  function goToRegister() {
    router.push('/register' as Href);
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.centered}>
          <AuthHeader title="SoluVet" subtitle="Inicia sesión para continuar" />

          <LoginForm
            form={form}
            fieldErrors={{}}
            onChangeField={handleChangeField}
            onForgotPassword={handleForgotPassword}
            onSubmit={handleSubmit}
            loading={loading}
          />

          {error ? (
            <HelperText type="error" visible={!!error} style={styles.generalError}>
              {error}
            </HelperText>
          ) : null}

          <Text style={styles.footerText}>
            ¿No tienes cuenta?{' '}
            <Text style={styles.footerLink} onPress={goToRegister}>
              Crear una cuenta
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    alignSelf: 'center',
    maxWidth: 440,
    width: '100%',
  },
  generalError: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    padding: 12,
    textAlign: 'center',
  },
  footerText: {
    color: colors.muted,
    marginTop: 20,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
