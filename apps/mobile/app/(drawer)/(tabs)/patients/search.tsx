import {
  searchPatients,
  searchTutors,
} from "@/src/features/patients/patients.service";
import { Patient, TutorWithPatients } from "@/src/types/patient";
import { router, type Href } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, SegmentedButtons } from "react-native-paper";

type SearchMode = "patient" | "tutor";

const searchPrompts: Record<SearchMode, string> = {
  patient: "Escribe un nombre o apellido de paciente.",
  tutor: "Escribe un nombre, apellido o RUT del tutor.",
};

export default function SearchPatientScreen() {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("patient");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tutors, setTutors] = useState<TutorWithPatients[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  function clearResults() {
    setPatients([]);
    setTutors([]);
    setError("");
    setHasSearched(false);
  }

  function handleModeChange(value: string) {
    setSearchMode(value as SearchMode);
    clearResults();
  }

  async function handleSearch() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError(searchPrompts[searchMode]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setHasSearched(true);

      if (searchMode === "patient") {
        const results = await searchPatients(trimmedQuery);

        setPatients(results);
        setTutors([]);
      } else {
        const results = await searchTutors(trimmedQuery);

        setTutors(results);
        setPatients([]);
      }
    } catch {
      setError(
        "No se pudo completar la búsqueda. Revisa la conexión e intenta nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  const showPatientEmptyState =
    searchMode === "patient" &&
    hasSearched &&
    !loading &&
    !error &&
    !patients.length;
  const showTutorEmptyState =
    searchMode === "tutor" &&
    hasSearched &&
    !loading &&
    !error &&
    !tutors.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar paciente</Text>
      <Text style={styles.subtitle}>
        Busca por paciente o por tutor según el dato que tengas a mano.
      </Text>

      <SegmentedButtons
        value={searchMode}
        onValueChange={handleModeChange}
        style={styles.modeTabs}
        buttons={[
          { value: "patient", label: "Paciente", icon: "paw" },
          { value: "tutor", label: "Tutor", icon: "account" },
        ]}
      />

      <TextInput
        style={styles.input}
        placeholder={
          searchMode === "patient"
            ? "Nombre o apellido del paciente"
            : "Nombre, apellido o RUT del tutor"
        }
        value={query}
        onChangeText={setQuery}
        autoCapitalize={searchMode === "tutor" ? "characters" : "words"}
      />

      <Button
        mode="contained"
        onPress={handleSearch}
        loading={loading}
        disabled={loading}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
        icon="magnify">
        {loading ? "Buscando..." : "Buscar"}
      </Button>

      {loading && <ActivityIndicator style={styles.loader} />}

      {error ? (
        <View style={styles.feedbackBox}>
          <Text style={styles.error}>{error}</Text>
          {query.trim() ? (
            <Button
              mode="outlined"
              onPress={handleSearch}
              disabled={loading}
              textColor={colors.text}
              style={styles.retryButton}
              icon="refresh">
              Reintentar
            </Button>
          ) : null}
        </View>
      ) : null}

      {showPatientEmptyState || showTutorEmptyState ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {searchMode === "patient"
              ? "No encontramos pacientes"
              : "No encontramos tutores"}
          </Text>
          <Text style={styles.emptyText}>
            Revisa el texto de búsqueda o registra una nueva ficha.
          </Text>
          <Button
            mode="outlined"
            onPress={() => router.push("/patients/create")}
            textColor={colors.text}
            style={styles.retryButton}
            icon="plus">
            Registrar paciente
          </Button>
        </View>
      ) : null}

      {searchMode === "patient" ? (
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
              }>
              <Text style={styles.resultTitle}>
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
      ) : (
        <FlatList
          data={tutors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.resultTitle}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.cardText}>RUT: {item.rut}</Text>
              <Text style={styles.cardText}>Teléfono: {item.phone}</Text>
              <Text style={styles.cardText}>
                Correo: {item.email || "No registrado"}
              </Text>

              <Button
                mode="outlined"
                onPress={() => router.push(`/tutors/${item.id}` as Href)}
                textColor="#0f172a"
                style={styles.tutorDetailButton}
                icon="file-eye">
                Ver ficha del tutor
              </Button>

              <Text style={styles.patientListTitle}>Mascotas</Text>
              {item.patients.length ? (
                item.patients.map((patient) => (
                  <TouchableOpacity
                    key={patient.id}
                    style={styles.patientRow}
                    onPress={() =>
                      router.push({
                        pathname: "/patients/[id]",
                        params: { id: patient.id },
                      })
                    }>
                    <Text style={styles.patientRowTitle}>
                      {patient.firstName} {patient.lastName}
                    </Text>
                    <Text style={styles.patientRowText}>
                      {patient.species}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.cardText}>Sin pacientes registrados</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const colors = {
  background: "#0F172A",
  primary: "#22C55E",
  text: "#F8FAFC",
  muted: "#94A3B8",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 16,
  },
  modeTabs: {
    marginBottom: 16,
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
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonContent: {
    paddingVertical: 6,
  },
  loader: {
    marginTop: 20,
  },
  feedbackBox: {
    marginTop: 16,
  },
  error: {
    backgroundColor: "#fc2626",
    padding: 8,
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 15,
  },
  retryButton: {
    borderColor: colors.muted,
    borderRadius: 8,
    marginTop: 12,
  },
  emptyState: {
    borderColor: "#334155",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
  },
  list: {
    gap: 12,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  resultTitle: {
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
  patientListTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
  },
  tutorDetailButton: {
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginTop: 8,
  },
  patientRow: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  patientRowTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
  },
  patientRowText: {
    color: "#475569",
    marginTop: 2,
  },
});
