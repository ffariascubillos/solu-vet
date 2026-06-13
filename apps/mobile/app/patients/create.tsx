import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import {
  createPatient,
  createTutor,
} from "@/src/features/patients/patients.service";
import type { CreatePatientInput, CreateTutorInput } from "@/src/types/patient";

type TutorForm = {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  phone: string;
  rut: string;
};

type PatientForm = {
  firstName: string;
  lastName: string;
  sex: CreatePatientInput["sex"];
  age: string;
  species: string;
  breed: string;
  reproductiveStatus: CreatePatientInput["reproductiveStatus"];
};

const initialTutorForm: TutorForm = {
  firstName: "",
  lastName: "",
  address: "",
  email: "",
  phone: "",
  rut: "",
};

const initialPatientForm: PatientForm = {
  firstName: "",
  lastName: "",
  sex: "FEMALE",
  age: "",
  species: "",
  breed: "",
  reproductiveStatus: "NOT_STERILIZED",
};

export default function CreatePatientScreen() {
  const [tutorForm, setTutorForm] = useState<TutorForm>(initialTutorForm);
  const [patientForm, setPatientForm] =
    useState<PatientForm>(initialPatientForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateTutorField(field: keyof TutorForm, value: string) {
    setTutorForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePatientField<K extends keyof PatientForm>(
    field: K,
    value: PatientForm[K],
  ) {
    setPatientForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    if (
      !tutorForm.firstName.trim() ||
      !tutorForm.lastName.trim() ||
      !tutorForm.address.trim() ||
      !tutorForm.phone.trim() ||
      !tutorForm.rut.trim()
    ) {
      return "Completa los datos obligatorios del tutor.";
    }

    if (tutorForm.email.trim() && !tutorForm.email.includes("@")) {
      return "Ingresa un correo electrónico válido.";
    }

    if (!patientForm.firstName.trim() || !patientForm.species.trim()) {
      return "Completa los datos obligatorios del paciente.";
    }

    if (patientForm.age.trim()) {
      const age = Number(patientForm.age);

      if (!Number.isInteger(age) || age < 0) {
        return "La edad debe ser un número entero mayor o igual a cero.";
      }
    }

    return "";
  }

  function buildTutorInput(): CreateTutorInput {
    return {
      firstName: tutorForm.firstName.trim(),
      lastName: tutorForm.lastName.trim(),
      address: tutorForm.address.trim(),
      email: tutorForm.email.trim() || undefined,
      phone: tutorForm.phone.trim(),
      rut: tutorForm.rut.trim(),
    };
  }

  function buildPatientInput(tutorId: string): CreatePatientInput {
    const age = patientForm.age.trim()
      ? Number(patientForm.age.trim())
      : undefined;

    return {
      firstName: patientForm.firstName.trim(),
      lastName: patientForm.lastName.trim() || undefined,
      sex: patientForm.sex,
      age,
      species: patientForm.species.trim(),
      breed: patientForm.breed.trim() || undefined,
      reproductiveStatus: patientForm.reproductiveStatus,
      tutorId,
    };
  }

  async function handleSubmit() {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const tutor = await createTutor(buildTutorInput());
      const patient = await createPatient(buildPatientInput(tutor.id));

      router.replace({
        pathname: "/patients/[id]",
        params: { id: patient.id },
      });
    } catch {
      setError(
        "No se pudo registrar el tutor o el paciente. Revisa los datos e intenta nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Registrar paciente</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tutor</Text>

          <FormInput
            label="Nombre"
            value={tutorForm.firstName}
            onChangeText={(value) => updateTutorField("firstName", value)}
          />
          <FormInput
            label="Apellido"
            value={tutorForm.lastName}
            onChangeText={(value) => updateTutorField("lastName", value)}
          />
          <FormInput
            label="Dirección"
            value={tutorForm.address}
            onChangeText={(value) => updateTutorField("address", value)}
          />
          <FormInput
            label="Correo electrónico"
            value={tutorForm.email}
            onChangeText={(value) => updateTutorField("email", value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormInput
            label="Teléfono"
            value={tutorForm.phone}
            onChangeText={(value) => updateTutorField("phone", value)}
            keyboardType="phone-pad"
          />
          <FormInput
            label="RUT"
            value={tutorForm.rut}
            onChangeText={(value) => updateTutorField("rut", value)}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paciente</Text>

          <FormInput
            label="Nombre"
            value={patientForm.firstName}
            onChangeText={(value) => updatePatientField("firstName", value)}
          />
          <FormInput
            label="Apellido"
            value={patientForm.lastName}
            onChangeText={(value) => updatePatientField("lastName", value)}
          />

          <Text style={styles.label}>Sexo</Text>
          <View style={styles.optionRow}>
            <OptionButton
              label="Hembra"
              selected={patientForm.sex === "FEMALE"}
              onPress={() => updatePatientField("sex", "FEMALE")}
            />
            <OptionButton
              label="Macho"
              selected={patientForm.sex === "MALE"}
              onPress={() => updatePatientField("sex", "MALE")}
            />
          </View>

          <FormInput
            label="Edad"
            value={patientForm.age}
            onChangeText={(value) => updatePatientField("age", value)}
            keyboardType="number-pad"
          />
          <FormInput
            label="Especie"
            value={patientForm.species}
            onChangeText={(value) => updatePatientField("species", value)}
          />
          <FormInput
            label="Raza"
            value={patientForm.breed}
            onChangeText={(value) => updatePatientField("breed", value)}
          />

          <Text style={styles.label}>Estado reproductivo</Text>
          <View style={styles.optionRow}>
            <OptionButton
              label="No esterilizado"
              selected={patientForm.reproductiveStatus === "NOT_STERILIZED"}
              onPress={() =>
                updatePatientField("reproductiveStatus", "NOT_STERILIZED")
              }
            />
            <OptionButton
              label="Esterilizado"
              selected={patientForm.reproductiveStatus === "STERILIZED"}
              onPress={() =>
                updatePatientField("reproductiveStatus", "STERILIZED")
              }
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Registrar paciente</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

function FormInput({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "words",
}: FormInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

type OptionButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function OptionButton({ label, selected, onPress }: OptionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionButtonText,
          selected && styles.optionButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const colors = {
  background: "#0F172A",
  primary: "#22C55E",
  secondaryDark: "#0284C7",
  text: "#F8FAFC",
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    color: "#0f172a",
    fontSize: 16,
    padding: 12,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: colors.secondaryDark,
    borderColor: colors.secondaryDark,
  },
  optionButtonText: {
    color: "#334155",
    fontWeight: "700",
  },
  optionButtonTextSelected: {
    color: "#ffffff",
  },
  error: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 15,
    marginBottom: 14,
    padding: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
    padding: 18,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
});
