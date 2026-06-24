import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Avatar, Button, Card, HelperText, Text } from 'react-native-paper';

import { PatientForm } from '@/src/features/patients/components/PatientForm';
import {
  createPatient,
  getTutorById,
} from '@/src/features/patients/patients.service';
import {
  initialPatientForm,
  PatientForm as PatientFormState,
} from '@/src/features/patients/registration.types';
import { validatePatientForm } from '@/src/features/patients/registration.validation';
import type { CreatePatientInput, TutorWithPatients } from '@/src/types/patient';

export default function CreatePatientScreen() {
  const { tutorId } = useLocalSearchParams<{ tutorId?: string }>();
  const [patientForm, setPatientForm] =
    useState<PatientFormState>(initialPatientForm);
  const [selectedTutor, setSelectedTutor] = useState<TutorWithPatients | null>(
    null,
  );
  const [loadingTutor, setLoadingTutor] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (typeof tutorId !== 'string' || !tutorId) {
        setSelectedTutor(null);
        setLoadingTutor(false);
        setError('Selecciona un tutor antes de registrar una mascota.');
        return;
      }

      const selectedTutorId = tutorId;
      let isActive = true;

      async function loadSelectedTutor() {
        try {
          setLoadingTutor(true);
          setError('');

          const tutor = await getTutorById(selectedTutorId);

          if (isActive) {
            setSelectedTutor(tutor);
            setPatientForm(initialPatientForm);
          }
        } catch {
          if (isActive) {
            setSelectedTutor(null);
            setError('No se pudo cargar el tutor seleccionado.');
          }
        } finally {
          if (isActive) {
            setLoadingTutor(false);
          }
        }
      }

      loadSelectedTutor();

      return () => {
        isActive = false;
      };
    }, [tutorId]),
  );

  function updatePatientField<K extends keyof PatientFormState>(
    field: K,
    value: PatientFormState[K],
  ) {
    setError('');
    setPatientForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function buildPatientInput(tutor: TutorWithPatients): CreatePatientInput {
    const age = patientForm.age.trim()
      ? Number(patientForm.age.trim())
      : undefined;

    return {
      firstName: patientForm.firstName.trim(),
      lastName: tutor.lastName,
      sex: patientForm.sex,
      age,
      species: patientForm.species.trim(),
      breed: patientForm.breed.trim() || undefined,
      reproductiveStatus: patientForm.reproductiveStatus,
      tutorId: tutor.id,
    };
  }

  async function handleSubmit() {
    if (!selectedTutor) {
      setError('Selecciona un tutor antes de registrar una mascota.');
      return;
    }

    const patientValidationError = validatePatientForm(patientForm);

    if (patientValidationError) {
      setError(patientValidationError);
      return;
    }

    try {
      setSaving(true);
      setError('');

      await createPatient(buildPatientInput(selectedTutor));

      setPatientForm(initialPatientForm);
      router.replace(
        `/tutors/${selectedTutor.id}?refresh=${Date.now()}` as Href,
      );
    } catch {
      setError('No se pudo registrar la mascota. Revisa los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  function goToTutorSearch() {
    router.replace('/patients/search' as Href);
  }

  function goToTutorRegistration() {
    router.replace('/tutors/create' as Href);
  }

  if (loadingTutor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando tutor...</Text>
      </View>
    );
  }

  if (!selectedTutor) {
    return (
      <View style={styles.loadingContainer}>
        <Avatar.Icon size={50} icon="account-alert" style={styles.logoIcon} />
        <Text variant="headlineSmall" style={styles.title}>
          Falta seleccionar tutor
        </Text>
        <Text style={styles.subtitle}>{error}</Text>
        <View style={styles.actionRow}>
          <Button
            mode="outlined"
            onPress={goToTutorSearch}
            textColor={colors.text}
            style={styles.secondaryButton}
            icon="magnify">
            Buscar tutor
          </Button>
          <Button
            mode="contained"
            onPress={goToTutorRegistration}
            style={styles.submitButton}
            icon="plus">
            Registrar tutor
          </Button>
        </View>
      </View>
    );
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
            Registrar mascota
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Agrega una mascota a la ficha del tutor seleccionado.
          </Text>
        </View>

        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <Text variant="labelLarge" style={styles.summaryLabel}>
              Tutor seleccionado
            </Text>
            <Text style={styles.summaryText}>
              {selectedTutor.firstName} {selectedTutor.lastName}
            </Text>
            <Text style={styles.summaryMuted}>RUT {selectedTutor.rut}</Text>
          </Card.Content>
        </Card>

        <PatientForm form={patientForm} onChangeField={updatePatientField} />

        {error ? (
          <HelperText
            type="error"
            visible={!!error}
            style={styles.generalError}>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={saving}
          disabled={saving}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          icon="check-circle">
          {saving ? 'Registrando...' : 'Registrar mascota'}
        </Button>
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
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.text,
    marginTop: 12,
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
    width: '100%',
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
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
});
