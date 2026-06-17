import { getPatientById } from "@/src/features/patients/patients.service";
import { Patient } from "@/src/types/patient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

const sexLabels: Record<Patient["sex"], string> = {
  FEMALE: "Hembra",
  MALE: "Macho",
};

const reproductiveStatusLabels: Record<Patient["reproductiveStatus"], string> = {
  NOT_STERILIZED: "No esterilizado",
  STERILIZED: "Esterilizado",
};

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadingPatient() {
      try {
        setLoading(true);
        setError("");

        const data = await getPatientById(String(id));

        setPatient(data);
      } catch {
        setError("No se pudo cargar la ficha del paciente.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadingPatient();
    }
  }, [id]);

  function openMaps() {
    if (!patient?.tutor.address) return;

    const encodedAddress = encodeURIComponent(patient.tutor.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    Linking.openURL(url);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando ficha...</Text>
      </View>
    );
  }

  if (error || !patient) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Paciente no encontrado"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {patient.firstName} {patient.lastName}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Datos del paciente</Text>
        <Text style={styles.text}>Especie: {patient.species}</Text>
        <Text style={styles.text}>
          Raza: {patient.breed || "No registrada"}
        </Text>
        <Text style={styles.text}>Edad: {patient.age ?? "No registrada"}</Text>
        <Text style={styles.text}>Sexo: {sexLabels[patient.sex]}</Text>
        <Text style={styles.text}>
          Estado reproductivo:{" "}
          {reproductiveStatusLabels[patient.reproductiveStatus]}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tutor</Text>
        <Text style={styles.text}>
          Nombre: {patient.tutor.firstName} {patient.tutor.lastName}
        </Text>
        <Text style={styles.text}>Dirección: {patient.tutor.address}</Text>
        <Text style={styles.text}>Teléfono: {patient.tutor.phone}</Text>
        <Text style={styles.text}>
          Correo: {patient.tutor.email || "No registrado"}
        </Text>
        <Text style={styles.text}>RUT: {patient.tutor.rut}</Text>

        <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
          <Text style={styles.mapButtonText}>Ver dirección en Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Consultas</Text>

        {!patient.consultations?.length ? (
          <Text style={styles.text}>Sin consultas registradas</Text>
        ) : (
          patient.consultations.map((c) => (
            <View key={c.id} style={styles.consultationItem}>
              <Text style={styles.consultationTitle}>
                {c.consultationReason}
              </Text>
              <Text style={styles.text}>
                Diagnóstico: {c.diagnosis || "No registrado"}
              </Text>
              <Text style={styles.text}>
                Fecha: {new Date(c.consultationDate).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#475569",
  },
  error: {
    backgroundColor: "#fc2626",
    padding: 8,
    borderRadius: 8,
    color: "#ffffff",
    marginTop: 16,
    fontSize: 15,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#c7c7c7",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 6,
  },
  mapButton: {
    marginTop: 12,
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  mapButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  consultationItem: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    marginTop: 12,
  },
  consultationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
});
