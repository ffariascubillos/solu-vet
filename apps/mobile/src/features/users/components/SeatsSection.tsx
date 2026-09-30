import { router, type Href } from 'expo-router';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { colors } from '@/src/theme/colors';

import { useSeats } from '../hooks/useSeats';
import { roleLabels } from '../roles';
import type { Seat } from '../types/users.types';

const statusLabels: Record<Seat['status'], string> = {
  ACTIVE: 'Activo',
  PENDING: 'Invitación pendiente',
};

function confirmAction(title: string, message: string, confirmText: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}

export function SeatsSection() {
  const { limit, seats, isFull, loading, error, cancelInvitation, removeUser } = useSeats();

  function handleSeatAction(seat: Seat) {
    const label = seat.name || seat.email;

    if (seat.status === 'PENDING') {
      confirmAction(
        'Cancelar invitación',
        `¿Seguro que quieres cancelar la invitación de ${label}?`,
        'Cancelar invitación',
        () => cancelInvitation(seat.id)
      );
      return;
    }

    confirmAction(
      'Dar de baja',
      `¿Seguro que quieres dar de baja a ${label}?`,
      'Dar de baja',
      () => removeUser(seat.id)
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Usuarios de la clínica</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Text style={styles.count}>
            {seats.length} de {limit}
          </Text>

          {isFull ? (
            <Text style={styles.limitMessage}>
              La clínica alcanzó el límite de {limit} usuarios (tú + {limit - 1} invitados).
            </Text>
          ) : null}

          {seats.map((seat) => (
            <View key={seat.id} style={styles.row}>
              <Text style={styles.value}>{seat.name || seat.email}</Text>
              <Text style={styles.label}>{roleLabels[seat.role]}</Text>
              <Text style={styles.label}>{statusLabels[seat.status]}</Text>
              {seat.role !== 'OWNER' ? (
                <Button
                  mode="text"
                  compact
                  textColor="#dc2626"
                  style={styles.rowButton}
                  onPress={() => handleSeatAction(seat)}>
                  {seat.status === 'PENDING' ? 'Cancelar invitación' : 'Dar de baja'}
                </Button>
              ) : null}
            </View>
          ))}

          {!isFull ? (
            <Button
              mode="outlined"
              onPress={() => router.push('/cuenta/invitar' as Href)}
              style={styles.inviteButton}
              contentStyle={styles.inviteButtonContent}
              icon="account-plus">
              Invitar usuario
            </Button>
          ) : null}
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
    padding: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  count: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 4,
  },
  limitMessage: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    borderTopColor: '#334155',
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  rowButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  inviteButton: {
    borderRadius: 8,
    marginTop: 12,
  },
  inviteButtonContent: {
    paddingVertical: 6,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 8,
  },
});
