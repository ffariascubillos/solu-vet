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
import { RegisterForm } from '@/src/features/auth/components/RegisterForm';
import { initialRegisterForm } from '@/src/features/auth/types/auth.types';
import { validateRegisterForm } from '@/src/features/auth/auth.validation';
import { colors } from '@/src/theme/colors';

import type { RegisterForm as RegisterFormState } from '@/src/features/auth/types/auth.types';

export default function RegisterScreen() {
  const [form, setForm] = useState<RegisterFormState>(initialRegisterForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChangeField(
    field: keyof RegisterFormState,
    value: string,
  ) {
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    const validationError = validateRegisterForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    // TODO: conectar con POST /api/auth/register cuando el backend exista.
    setLoading(false);
  }

  function goToLogin() {
    router.push('/login' as Href);
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
          <AuthHeader
            title="Crea tu cuenta"
            subtitle="Regístrate para empezar a usar SoluVet"
          />

          <RegisterForm
            form={form}
            fieldErrors={{}}
            onChangeField={handleChangeField}
            onSubmit={handleSubmit}
            loading={loading}
          />

          {error ? (
            <HelperText type="error" visible={!!error} style={styles.generalError}>
              {error}
            </HelperText>
          ) : null}

          <Text style={styles.footerText}>
            ¿Ya tienes cuenta?{' '}
            <Text style={styles.footerLink} onPress={goToLogin}>
              Iniciar sesión
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
