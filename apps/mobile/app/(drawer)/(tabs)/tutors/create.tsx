import { router, type Href } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Avatar, Button, HelperText, Text } from 'react-native-paper';

import { TutorForm } from '@/src/features/patients/components/TutorForm';
import {
  createTutor,
  getTutorRegistrationError,
} from '@/src/features/patients/patients.service';
import {
  initialTutorForm,
  TutorFieldErrors,
  TutorForm as TutorFormState,
} from '@/src/features/patients/registration.types';
import {
  normalizeRut,
  validateTutorForm,
} from '@/src/features/patients/registration.validation';
import type { CreateTutorInput } from '@/src/types/patient';

export default function CreateTutorScreen() {
  const [tutorForm, setTutorForm] = useState<TutorFormState>(initialTutorForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tutorFieldErrors, setTutorFieldErrors] = useState<TutorFieldErrors>(
    {},
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
      address: tutorForm.address.trim(),
      email: tutorForm.email.trim() || undefined,
      phone: tutorForm.phone.trim(),
      rut: normalizeRut(tutorForm.rut),
    };
  }

  async function handleSubmit() {
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

      const tutor = await createTutor(buildTutorInput());

      setTutorForm(initialTutorForm);
      router.replace(`/tutors/${tutor.id}?refresh=${Date.now()}` as Href);
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
        setError('No se pudo registrar el tutor. Revisa los datos e intenta nuevamente.');
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
          <Avatar.Icon size={50} icon="account-plus" style={styles.logoIcon} />
          <Text variant="headlineMedium" style={styles.title}>
            Registrar tutor
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Crea la ficha del tutor y luego agrega sus mascotas desde la ficha.
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
          {saving ? 'Registrando...' : 'Registrar tutor'}
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
