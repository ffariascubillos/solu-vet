import { StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, TextInput } from 'react-native-paper';

import { colors } from '@/src/theme/colors';

import { OrganizationTypeToggle } from './OrganizationTypeToggle';

import type { RegisterForm as RegisterFormState } from '../types/auth.types';

type RegisterFormProps = {
  form: RegisterFormState;
  fieldErrors: Partial<Record<'email', string>>;
  onChangeField: (field: keyof RegisterFormState, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

export function RegisterForm({
  form,
  fieldErrors,
  onChangeField,
  onSubmit,
  loading,
}: RegisterFormProps) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.cardContent}>
        <TextInput
          style={styles.input}
          label="Nombre"
          mode="outlined"
          value={form.name}
          onChangeText={(value) => onChangeField('name', value)}
        />

        <OrganizationTypeToggle
          value={form.organizationType}
          onChange={(value) => onChangeField('organizationType', value)}
        />

        {form.organizationType === 'CLINIC' && (
          <TextInput
            style={styles.input}
            label="Nombre de la clínica"
            mode="outlined"
            value={form.clinicName}
            onChangeText={(value) => onChangeField('clinicName', value)}
          />
        )}

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

        <TextInput
          style={styles.input}
          label="Contraseña"
          mode="outlined"
          secureTextEntry
          value={form.password}
          onChangeText={(value) => onChangeField('password', value)}
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
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
});
