import { Redirect } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, HelperText, SegmentedButtons, TextInput } from 'react-native-paper';

import { useAuth } from '@/src/features/auth/hooks/useAuth';
import {
  invitableRoles,
  roleLabels,
  useInviteUser,
  useSeats,
  type InvitableRole,
} from '@/src/features/users';
import { colors } from '@/src/theme/colors';

export default function InvitarUsuarioScreen() {
  const { user, organization } = useAuth();
  const seats = useSeats();
  const { email, role, error, loading, success, onChangeEmail, onChangeRole, onSubmit } =
    useInviteUser();

  if (user?.role !== 'OWNER' || organization?.type !== 'CLINIC') {
    return <Redirect href="/cuenta" />;
  }

  if (seats.loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (seats.isFull) {
    return <Redirect href="/cuenta" />;
  }

  async function handleSubmit() {
    await onSubmit();
    await seats.reload();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Invitar usuario</Text>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <View>
            <TextInput
              style={styles.input}
              label="Correo electrónico"
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={onChangeEmail}
              error={!!error}
            />
          </View>

          <Text style={styles.label}>Cargo</Text>
          <SegmentedButtons
            value={role ?? ''}
            onValueChange={(value) => onChangeRole(value as InvitableRole)}
            buttons={invitableRoles.map((value) => ({ value, label: roleLabels[value] }))}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}>
            {loading ? 'Enviando...' : 'Enviar invitación'}
          </Button>

          {success ? (
            <Text style={styles.successText}>
              Invitación enviada correctamente.
            </Text>
          ) : null}
        </Card.Content>
      </Card>

      {error ? (
        <HelperText type="error" visible={!!error} style={styles.generalError}>
          {error}
        </HelperText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 24,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
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
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  generalError: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    padding: 12,
    textAlign: 'center',
  },
});
