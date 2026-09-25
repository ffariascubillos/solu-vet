import { router, useLocalSearchParams, type Href } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';

import { AuthHeader } from '@/src/features/auth/components/AuthHeader';
import { useResetPassword } from '@/src/features/auth/hooks/useResetPassword';
import { colors } from '@/src/theme/colors';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { form, error, loading, success, onChangeField, onSubmit } =
    useResetPassword(token);

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
            title="Restablece tu contraseña"
            subtitle="Define una nueva contraseña para tu cuenta"
          />

          {!token ? (
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <Text style={styles.successText}>
                  El enlace no es válido o ya expiró.
                </Text>
              </Card.Content>
            </Card>
          ) : success ? (
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <Text style={styles.successText}>
                  Tu contraseña se actualizó correctamente.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <TextInput
                  style={styles.input}
                  label="Nueva contraseña"
                  mode="outlined"
                  secureTextEntry
                  value={form.newPassword}
                  onChangeText={(value) => onChangeField('newPassword', value)}
                />

                <TextInput
                  style={styles.input}
                  label="Confirmar contraseña"
                  mode="outlined"
                  secureTextEntry
                  value={form.confirmPassword}
                  onChangeText={(value) => onChangeField('confirmPassword', value)}
                />

                <Button
                  mode="contained"
                  onPress={onSubmit}
                  loading={loading}
                  disabled={loading}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}>
                  {loading ? 'Guardando...' : 'Restablecer contraseña'}
                </Button>
              </Card.Content>
            </Card>
          )}

          {error ? (
            <HelperText type="error" visible={!!error} style={styles.generalError}>
              {error}
            </HelperText>
          ) : null}

          <Text style={styles.footerText}>
            <Text style={styles.footerLink} onPress={goToLogin}>
              Volver a iniciar sesión
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 20,
  },
  cardContent: {
    gap: 12,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.background,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
  successText: {
    color: colors.text,
    textAlign: 'center',
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
