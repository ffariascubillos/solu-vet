import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Button,
  Card,
  HelperText,
  SegmentedButtons,
  Text,
} from 'react-native-paper';

import { PatientForm } from '@/src/features/patients/components/PatientForm';
import { TutorForm } from '@/src/features/patients/components/TutorForm';
import {
  createPatient,
  createTutor,
  getTutorRegistrationError,
} from '@/src/features/patients/patients.service';
import {
  initialPatientForm,
  initialTutorForm,
  PatientForm as PatientFormState,
  TutorFieldErrors,
  TutorForm as TutorFormState,
} from '@/src/features/patients/registration.types';
import {
  normalizeRut,
  validatePatientForm,
  validateTutorForm,
} from '@/src/features/patients/registration.validation';
import type { CreatePatientInput, CreateTutorInput } from '@/src/types/patient';

type RegistrationStep = 'tutor' | 'patient';

export default function CreatePatientScreen() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('tutor');
  const [tutorForm, setTutorForm] = useState<TutorFormState>(initialTutorForm);
  const [patientForm, setPatientForm] =
    useState<PatientFormState>(initialPatientForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tutorFieldErrors, setTutorFieldErrors] = useState<TutorFieldErrors>(
    {},
  );

  function updateTutorField(field: keyof TutorFormState, value: string) {
    setTutorForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === 'rut' || field === 'email') {
      setTutorFieldErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  }

  function updatePatientField<K extends keyof PatientFormState>(
    field: K,
    value: PatientFormState[K],
  ) {
    setPatientForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function goToPatientStep() {
    const validationError = validateTutorForm(tutorForm);

    if (validationError) {
      setError(validationError);
      setTutorFieldErrors({});
      setCurrentStep('tutor');
      return;
    }

    setError('');
    setCurrentStep('patient');
  }

  function handleStepChange(value: string) {
    if (value === 'patient') {
      goToPatientStep();
      return;
    }

    setError('');
    setCurrentStep('tutor');
  }

  function resetForm() {
    setCurrentStep('tutor');
    setTutorForm(initialTutorForm);
    setPatientForm(initialPatientForm);
    setError('');
    setTutorFieldErrors({});
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
    const tutorValidationError = validateTutorForm(tutorForm);
    const patientValidationError = validatePatientForm(patientForm);

    if (tutorValidationError) {
      setError(tutorValidationError);
      setTutorFieldErrors({});
      setCurrentStep('tutor');
      return;
    }

    if (patientValidationError) {
      setError(patientValidationError);
      setCurrentStep('patient');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setTutorFieldErrors({});

      const tutor = await createTutor(buildTutorInput());
      const patient = await createPatient(buildPatientInput(tutor.id));

      resetForm();

      router.replace({
        pathname: '/patients/[id]',
        params: { id: patient.id },
      });
    } catch (submitError) {
      const tutorRegistrationError = getTutorRegistrationError(submitError);

      if (tutorRegistrationError?.field) {
        setTutorFieldErrors({
          [tutorRegistrationError.field]: tutorRegistrationError.message,
        });
        setCurrentStep('tutor');
        setError('');
      } else if (tutorRegistrationError) {
        setError(tutorRegistrationError.message);
      } else {
        setError(
          'No se pudo registrar el tutor o el paciente. Revisa los datos e intenta nuevamente.',
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Avatar.Icon size={50} icon="paw" style={styles.logoIcon} />
          <Text variant="headlineMedium" style={styles.title}>
            Registro de paciente
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Completa cada sección antes de guardar la ficha.
          </Text>
        </View>

        <SegmentedButtons
          value={currentStep}
          onValueChange={handleStepChange}
          style={styles.stepTabs}
          buttons={[
            { value: 'tutor', label: 'Tutor', icon: 'account' },
            { value: 'patient', label: 'Paciente', icon: 'paw' },
          ]}
        />

        {currentStep === 'tutor' ? (
          <TutorForm
            form={tutorForm}
            fieldErrors={tutorFieldErrors}
            onChangeField={updateTutorField}
          />
        ) : (
          <>
            <Card style={styles.summaryCard} mode="elevated">
              <Card.Content>
                <Text variant="labelLarge" style={styles.summaryLabel}>
                  Tutor seleccionado
                </Text>
                <Text style={styles.summaryText}>
                  {tutorForm.firstName.trim()} {tutorForm.lastName.trim()}
                </Text>
                <Text style={styles.summaryMuted}>
                  RUT {normalizeRut(tutorForm.rut)}
                </Text>
              </Card.Content>
            </Card>

            <PatientForm
              form={patientForm}
              onChangeField={updatePatientField}
            />
          </>
        )}

        {error && (
          <HelperText
            type="error"
            visible={!!error}
            style={styles.generalError}>
            {error}
          </HelperText>
        )}

        {currentStep === 'tutor' ? (
          <Button
            mode="contained"
            onPress={goToPatientStep}
            disabled={saving}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            icon="arrow-right">
            Continuar
          </Button>
        ) : (
          <View style={styles.actionRow}>
            <Button
              mode="outlined"
              onPress={() => {
                setError('');
                setCurrentStep('tutor');
              }}
              disabled={saving}
              style={styles.secondaryButton}
              textColor="#F8FAFC"
              icon="arrow-left">
              Volver
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              icon="check-circle">
              {saving ? 'Registrando...' : 'Registrar'}
            </Button>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const colors = {
  background: '#0F172A',
  card: '#1E293B',
  primary: '#22C55E',
  text: '#F8FAFC',
  muted: '#94A3B8',
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  logoIcon: {
    backgroundColor: colors.primary,
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
  },
  stepTabs: {
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 14,
  },
  summaryLabel: {
    color: colors.muted,
    marginBottom: 4,
  },
  summaryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryMuted: {
    color: colors.muted,
    marginTop: 2,
  },
  generalError: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    padding: 12,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    borderColor: colors.muted,
    borderRadius: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    flex: 1,
    marginTop: 0,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
});
