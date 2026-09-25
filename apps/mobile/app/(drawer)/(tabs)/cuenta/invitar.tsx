import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, HelperText, TextInput } from 'react-native-paper';

import { useInviteUser } from '@/src/features/auth/hooks/useInviteUser';
import { colors } from '@/src/theme/colors';

export default function InvitarUsuarioScreen() {
  const { email, error, loading, success, onChangeEmail, onSubmit } =
    useInviteUser();

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

          <Button
            mode="contained"
            onPress={onSubmit}
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
