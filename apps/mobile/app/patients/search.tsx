import { searchPatients } from "@/src/features/patients/patients.service";
import { Patient } from "@/src/types/patient";
import { router } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";

export default function SearchPatientScreen() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) {
      setError("Escribe un nombre de paciente o tutor");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const results = await searchPatients(query);

      setPatients(results);
    } catch {
      setError("No se pudo buscar. Revisa la conexión con la API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar paciente</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre de paciente o tutor"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="words"
      ></TextInput>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSearch}>
        <Text style={styles.primaryButtonText}>Buscar</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator style={styles.loader} />}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/patients/[id]",
                params: { id: item.id },
              })
            }
          >
            <Text style={styles.patientName}>
              {item.firstName} {item.lastName}
            </Text>

            <Text style={styles.cardText}>
              Tutor: {item.tutor.firstName} {item.tutor.lastName}
            </Text>

            <Text style={styles.cardText}>Especie: {item.species}</Text>

            <Text style={styles.cardText}>Teléfono: {item.tutor.phone}</Text>
          </TouchableOpacity>
        )}
      />
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
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
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
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  text: {
    fontSize: 16,
    color: "#475569",
  },
  loader: {
    marginTop: 20,
  },
  error: {
    backgroundColor: "#fc2626",
    padding: 8,
    borderRadius: 8,
    color: "#ffffff",
    marginTop: 16,
    fontSize: 15,
  },
  list: {
    gap: 12,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  patientName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 4,
  },
});
