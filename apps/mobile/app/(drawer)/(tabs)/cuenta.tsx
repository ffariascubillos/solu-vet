import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { roleLabels, SeatsSection, type UserRole } from '@/src/features/users';
import { colors } from '@/src/theme/colors';

const organizationTypeLabels: Record<string, string> = {
  INDEPENDENT: 'Veterinario independiente',
  CLINIC: 'Clínica',
};

export default function CuentaScreen() {
  const { user, organization, logout, logoutAll } = useAuth();

  function handleLogoutAll() {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Seguro que quieres cerrar la sesión en todos los dispositivos?')) {
        logoutAll();
      }
      return;
    }

    Alert.alert(
      'Cerrar sesión en todos los dispositivos',
      '¿Seguro que quieres cerrar la sesión en todos los dispositivos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesiones',
          style: 'destructive',
          onPress: () => logoutAll(),
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mi cuenta</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.value}>{user?.name}</Text>

        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>Rol</Text>
        <Text style={styles.value}>
          {user?.role ? roleLabels[user.role as UserRole] : ''}
        </Text>

        <Text style={styles.label}>Organización</Text>
        <Text style={styles.value}>{organization?.name}</Text>

        <Text style={styles.label}>Tipo</Text>
        <Text style={styles.value}>
          {organization?.type
            ? organizationTypeLabels[organization.type] ?? organization.type
            : ''}
        </Text>
      </View>

      {user?.role === 'OWNER' && organization?.type === 'CLINIC' ? <SeatsSection /> : null}

      <Button
        mode="contained"
        onPress={() => logout()}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon="logout">
        Cerrar sesión
      </Button>

      <Button
        mode="outlined"
        onPress={handleLogoutAll}
        style={styles.button}
        contentStyle={styles.buttonContent}
        textColor="#dc2626"
        icon="logout-variant">
        Cerrar sesión en todos los dispositivos
      </Button>
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
    padding: 16,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 10,
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    marginBottom: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
