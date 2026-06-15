import { Link } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vet App</Text>

      <Text style={styles.subtitle}>
        Gestión médica para clínicas, hospitales y atención veterinaria móvil
      </Text>

      <View style={styles.actions}>
        <Link href="/patients/search" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Buscar paciente</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.actions}>
        <Link href="/patients/create" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.primaryButtonText}>Registrar paciente</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const colors = {
  background: "#0F172A",
  primary: "#22C55E",
  secondary: "#38BDF8",
  secondaryDark: "#0284C7",
  text: "#F8FAFC",
  muted: "#94A3B8",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: 32,
  },
  actions: {
    marginTop: 16,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
});
