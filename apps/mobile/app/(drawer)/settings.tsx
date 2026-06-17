import { StyleSheet, Text, View } from 'react-native';

export default function GuideScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guía rápida</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registro</Text>
        <Text style={styles.text}>
          Registra primero los datos del tutor y luego los datos del paciente.
          La ficha se abre automáticamente cuando el registro finaliza.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Búsqueda</Text>
        <Text style={styles.text}>
          Busca pacientes por nombre del paciente o del tutor para revisar su
          ficha clínica y sus consultas registradas.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contexto de atención</Text>
        <Text style={styles.text}>
          El flujo sirve para clínicas, hospitales, atención móvil y equipos con
          operación mixta.
        </Text>
      </View>
    </View>
  );
}

const colors = {
  background: '#0F172A',
  text: '#F8FAFC',
  muted: '#94A3B8',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 14,
    padding: 16,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 21,
  },
});
