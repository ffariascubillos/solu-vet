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
import { Avatar, Button, HelperText, Text } from 'react-native-paper';

import { TutorForm } from '@/src/features/patients/components/TutorForm';
import {
  getTutorById,
  getTutorRegistrationError,
  updateTutor,
} from '@/src/features/patients/patients.service';
import {
  TutorFieldErrors,
  TutorForm as TutorFormState,
  initialTutorForm,
  toTutorFormState,
} from '@/src/features/patients/registration.types';
import {
  normalizeRut,
  validateTutorForm,
} from '@/src/features/patients/registration.validation';
import type { CreateTutorInput } from '@/src/types/patient';

export default function EditTutorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tutorForm, setTutorForm] = useState<TutorFormState>(initialTutorForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tutorFieldErrors, setTutorFieldErrors] = useState<TutorFieldErrors>(
    {},
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadTutor() {
        if (typeof id !== 'string' || !id) {
          setLoadError('Tutor no encontrado');
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setLoadError('');

          const tutor = await getTutorById(id);

          if (isActive) {
            setTutorForm(toTutorFormState(tutor));
          }
        } catch {
          if (isActive) {
            setLoadError('No se pudo cargar la ficha del tutor.');
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      loadTutor();

      return () => {
        isActive = false;
      };
    }, [id]),
  );

  function updateTutorField(field: keyof TutorFormState, value: string) {
    setError('');
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

  function buildTutorInput(): CreateTutorInput {
    return {
      firstName: tutorForm.firstName.trim(),
      lastName: tutorForm.lastName.trim(),
      region: tutorForm.region,
      comuna: tutorForm.comuna,
      streetAddress: tutorForm.streetAddress.trim(),
      email: tutorForm.email.trim() || undefined,
      phone: tutorForm.phone.trim(),
      rut: normalizeRut(tutorForm.rut),
    };
  }

  async function handleSubmit() {
    if (typeof id !== 'string' || !id) {
      return;
    }

    const tutorValidationError = validateTutorForm(tutorForm);

    if (tutorValidationError) {
      setError(tutorValidationError);
      setTutorFieldErrors({});
      return;
    }

    try {
      setSaving(true);
      setError('');
      setTutorFieldErrors({});

      await updateTutor(id, buildTutorInput());

      router.replace(`/tutors/${id}?refresh=${Date.now()}` as Href);
    } catch (submitError) {
      const tutorRegistrationError = getTutorRegistrationError(submitError);

      if (tutorRegistrationError?.field) {
        setTutorFieldErrors({
          [tutorRegistrationError.field]: tutorRegistrationError.message,
        });
        setError('');
      } else if (tutorRegistrationError) {
        setError(tutorRegistrationError.message);
      } else {
        setError('No se pudo actualizar el tutor. Revisa los datos e intenta nuevamente.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando ficha...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadErrorText}>{loadError}</Text>
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
          <Avatar.Icon size={50} icon="account-edit" style={styles.logoIcon} />
          <Text variant="headlineMedium" style={styles.title}>
            Editar tutor
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Actualiza los datos del tutor.
          </Text>
        </View>

        <TutorForm
          form={tutorForm}
          fieldErrors={tutorFieldErrors}
          onChangeField={updateTutorField}
        />

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
  center: {
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
