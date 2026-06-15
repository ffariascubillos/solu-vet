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
  getTutorRegistrationError,
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
  sex: CreatePatientInput["sex"];
  age: string;
  species: string;
  breed: string;
  reproductiveStatus: CreatePatientInput["reproductiveStatus"];
};

type TutorFieldErrors = Partial<Record<"rut" | "email", string>>;

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
  sex: "FEMALE",
  age: "",
  species: "",
  breed: "",
  reproductiveStatus: "NOT_STERILIZED",
};

function normalizeRut(rut: string) {
  return rut.replace(/\./g, "").replace(/\s/g, "").toUpperCase();
}

function isValidRut(rut: string) {
  const match = /^(\d{7,8})-([\dK])$/.exec(rut);

  if (!match) {
    return false;
  }

  const [, body, checkDigit] = match;
  let multiplier = 2;
  let sum = 0;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedDigit =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);

  return checkDigit === expectedDigit;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CreatePatientScreen() {
  const [tutorForm, setTutorForm] = useState<TutorForm>(initialTutorForm);
  const [patientForm, setPatientForm] =
    useState<PatientForm>(initialPatientForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tutorFieldErrors, setTutorFieldErrors] = useState<TutorFieldErrors>(
    {},
  );

  function updateTutorField(field: keyof TutorForm, value: string) {
    setTutorForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "rut" || field === "email") {
      setTutorFieldErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
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
    const normalizedRut = normalizeRut(tutorForm.rut);
    const tutorFirstName = tutorForm.firstName.trim();
    const tutorLastName = tutorForm.lastName.trim();
    const tutorAddress = tutorForm.address.trim();
    const tutorPhone = tutorForm.phone.trim();
    const patientFirstName = patientForm.firstName.trim();
    const patientSpecies = patientForm.species.trim();

    if (
      !tutorFirstName ||
      !tutorLastName ||
      !tutorAddress ||
      !tutorPhone ||
      !tutorForm.rut.trim()
    ) {
      return "Completa los datos obligatorios del tutor.";
    }

    if (tutorFirstName.length < 2 || tutorLastName.length < 2) {
      return "El nombre y apellido del tutor deben tener al menos 2 caracteres.";
    }

    if (tutorAddress.length < 5) {
      return "La dirección del tutor debe tener al menos 5 caracteres.";
    }

    if (tutorPhone.length < 8) {
      return "El teléfono del tutor debe tener al menos 8 caracteres.";
    }

    if (!isValidRut(normalizedRut)) {
      return "Ingresa un RUT válido.";
    }

    if (tutorForm.email.trim() && !isValidEmail(tutorForm.email.trim())) {
      return "Ingresa un correo electrónico válido.";
    }

    if (!patientFirstName || !patientSpecies) {
      return "Completa los datos obligatorios del paciente.";
    }

    if (patientSpecies.length < 2) {
      return "La especie del paciente debe tener al menos 2 caracteres.";
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
      rut: normalizeRut(tutorForm.rut),
    };
  }

  function buildPatientInput(tutorId: string): CreatePatientInput {
    const age = patientForm.age.trim()
      ? Number(patientForm.age.trim())
      : undefined;

    return {
      firstName: patientForm.firstName.trim(),
      lastName: tutorForm.lastName.trim(),
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
      setTutorFieldErrors({});
      return;
    }

    try {
      setSaving(true);
      setError("");
      setTutorFieldErrors({});

      const tutor = await createTutor(buildTutorInput());
      const patient = await createPatient(buildPatientInput(tutor.id));

      router.replace({
        pathname: "/patients/[id]",
        params: { id: patient.id },
      });
    } catch (submitError) {
      const tutorRegistrationError = getTutorRegistrationError(submitError);

      if (tutorRegistrationError?.field) {
        setTutorFieldErrors({
          [tutorRegistrationError.field]: tutorRegistrationError.message,
        });
        setError("");
      } else if (tutorRegistrationError) {
        setError(tutorRegistrationError.message);
      } else {
        setError(
          "No se pudo registrar el tutor o el paciente. Revisa los datos e intenta nuevamente.",
        );
      }
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
            error={tutorFieldErrors.email}
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
            error={tutorFieldErrors.rut}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paciente</Text>

          <FormInput
            label="Nombre"
            value={patientForm.firstName}
            onChangeText={(value) => updatePatientField("firstName", value)}
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
            <View style={styles.submitButtonContent}>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.savingText}>Registrando...</Text>
            </View>
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
  error?: string;
};

function FormInput({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "words",
  error,
}: FormInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
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
  inputError: {
    borderColor: "#dc2626",
  },
  fieldError: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
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
  submitButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  savingText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
});
