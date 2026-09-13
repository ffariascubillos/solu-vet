import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';

import { colors } from '@/src/theme/colors';

import type { LoginForm as LoginFormState } from '../types/auth.types';

type LoginFormProps = {
  form: LoginFormState;
  fieldErrors: Partial<Record<'email' | 'password', string>>;
  onChangeField: (field: keyof LoginFormState, value: string) => void;
  onForgotPassword: () => void;
  onSubmit: () => void;
  loading: boolean;
};

export function LoginForm({
  form,
  fieldErrors,
  onChangeField,
  onForgotPassword,
  onSubmit,
  loading,
}: LoginFormProps) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.cardContent}>
        <View>
          <TextInput
            style={styles.input}
            label="Correo electrónico"
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) => onChangeField('email', value)}
            error={!!fieldErrors.email}
          />
          {fieldErrors.email && (
            <HelperText type="error">{fieldErrors.email}</HelperText>
          )}
        </View>

        <View>
          <TextInput
            style={styles.input}
            label="Contraseña"
            mode="outlined"
            secureTextEntry
            value={form.password}
            onChangeText={(value) => onChangeField('password', value)}
            error={!!fieldErrors.password}
          />
          {fieldErrors.password && (
            <HelperText type="error">{fieldErrors.password}</HelperText>
          )}
        </View>

        <Text style={styles.forgotPassword} onPress={onForgotPassword}>
          ¿Olvidaste tu contraseña?
        </Text>

        <Button
          mode="contained"
          onPress={onSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}>
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  forgotPassword: {
    alignSelf: 'flex-end',
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
});
