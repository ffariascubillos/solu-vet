import { router, type Href } from 'expo-router';
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
import { useRegister } from '@/src/features/auth/hooks/useRegister';
import { colors } from '@/src/theme/colors';

export default function RegisterScreen() {
  const { form, error, loading, onChangeField, onSubmit } = useRegister();

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
            onChangeField={onChangeField}
            onSubmit={onSubmit}
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
