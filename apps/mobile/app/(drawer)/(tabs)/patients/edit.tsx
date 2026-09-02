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
  getPatientById,
  updatePatient,
} from '@/src/features/patients/patients.service';
import {
  initialPatientForm,
  PatientForm as PatientFormState,
  toPatientFormState,
} from '@/src/features/patients/registration.types';
import { validatePatientForm } from '@/src/features/patients/registration.validation';
import type { CreatePatientInput, Patient } from '@/src/types/patient';

export default function EditPatientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patientForm, setPatientForm] =
    useState<PatientFormState>(initialPatientForm);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadPatient() {
        if (typeof id !== 'string' || !id) {
          setLoadError('Paciente no encontrado');
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setLoadError('');

          const data = await getPatientById(id);

          if (isActive) {
            setPatient(data);
            setPatientForm(toPatientFormState(data));
          }
        } catch {
          if (isActive) {
            setLoadError('No se pudo cargar la ficha del paciente.');
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadPatient();

      return () => {
        isActive = false;
      };
    }, [id]),
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

  function buildPatientInput(currentPatient: Patient): CreatePatientInput {
    const age = patientForm.age.trim()
      ? Number(patientForm.age.trim())
      : undefined;

    return {
      firstName: patientForm.firstName.trim(),
      lastName: currentPatient.tutor.lastName,
      sex: patientForm.sex,
      age,
      speciesId: patientForm.speciesId,
      breedId: patientForm.breedId,
      reproductiveStatus: patientForm.reproductiveStatus,
      tutorId: currentPatient.tutor.id,
    };
  }

  async function handleSubmit() {
    if (typeof id !== 'string' || !id || !patient) {
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

      await updatePatient(id, buildPatientInput(patient));

      router.replace(`/patients/${id}?refresh=${Date.now()}` as Href);
    } catch {
      setError('No se pudo actualizar la mascota. Revisa los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando mascota...</Text>
      </View>
    );
  }

  if (loadError || !patient) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadErrorText}>
          {loadError || 'Paciente no encontrado'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Avatar.Icon size={50} icon="paw" style={styles.logoIcon} />
          <Text variant="headlineMedium" style={styles.title}>
            Editar mascota
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Actualiza los datos de la mascota.
          </Text>
        </View>

        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <Text variant="labelLarge" style={styles.summaryLabel}>
              Tutor
            </Text>
            <Text style={styles.summaryText}>
              {patient.tutor.firstName} {patient.tutor.lastName}
            </Text>
            <Text style={styles.summaryMuted}>RUT {patient.tutor.rut}</Text>
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
          {saving ? 'Guardando...' : 'Guardar cambios'}
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
  loadErrorText: {
    color: colors.text,
    fontSize: 15,
    textAlign: 'center',
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
});
