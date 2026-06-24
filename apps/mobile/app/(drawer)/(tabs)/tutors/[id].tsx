import { getTutorById } from '@/src/features/patients/patients.service';
import type { TutorWithPatients } from '@/src/types/patient';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from 'react-native-paper';

export default function TutorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tutor, setTutor] = useState<TutorWithPatients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadTutor() {
        if (typeof id !== 'string' || !id) {
          setError('Tutor no encontrado');
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError('');

          const data = await getTutorById(id);

          if (isActive) {
            setTutor(data);
          }
        } catch {
          if (isActive) {
            setError('No se pudo cargar la ficha del tutor.');
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

  function getRefreshToken() {
    return String(Date.now());
  }

  function getCreatePatientHref(tutorId: string) {
    return `/patients/create?tutorId=${tutorId}&refresh=${getRefreshToken()}` as Href;
  }

  function openMaps() {
    if (!tutor?.address) {
      return;
    }

    const encodedAddress = encodeURIComponent(tutor.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    Linking.openURL(url);
  }

  function openPatient(patientId: string) {
    router.push({
      pathname: '/patients/[id]',
      params: { id: patientId },
    });
  }

  function addPatient() {
    if (!tutor) {
      return;
    }

    router.push(getCreatePatientHref(tutor.id));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Cargando ficha...</Text>
      </View>
    );
  }

  if (error || !tutor) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Tutor no encontrado'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {tutor.firstName} {tutor.lastName}
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Datos del tutor</Text>
        <Text style={styles.text}>RUT: {tutor.rut}</Text>
        <Text style={styles.text}>Teléfono: {tutor.phone}</Text>
        <Text style={styles.text}>
          Correo: {tutor.email || 'No registrado'}
        </Text>
        <Text style={styles.text}>Dirección: {tutor.address}</Text>

        <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
          <Text style={styles.mapButtonText}>Ver dirección en Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mascotas</Text>
          <Text style={styles.countText}>{tutor.patients.length}</Text>
        </View>

        {!tutor.patients.length ? (
          <Text style={styles.text}>Sin mascotas registradas</Text>
        ) : (
          tutor.patients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientRow}
              onPress={() => openPatient(patient.id)}>
              <Text style={styles.patientName}>
                {patient.firstName} {patient.lastName}
              </Text>
              <Text style={styles.patientText}>Especie: {patient.species}</Text>
              <Text style={styles.patientText}>
                Raza: {patient.breed || 'No registrada'}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <Button
          mode="contained"
          onPress={addPatient}
          style={styles.addButton}
          contentStyle={styles.addButtonContent}
          icon="plus">
          Agregar mascota
        </Button>
      </View>
    </ScrollView>
  );
}

const colors = {
  background: '#0F172A',
  primary: '#22C55E',
  text: '#F8FAFC',
  muted: '#94A3B8',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 24,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#475569',
    marginTop: 12,
  },
  error: {
    backgroundColor: '#fc2626',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 15,
    marginTop: 16,
    padding: 8,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#c7c7c7',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  countText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  text: {
    color: '#475569',
    fontSize: 15,
    marginBottom: 6,
  },
  mapButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 8,
    marginTop: 12,
    padding: 14,
  },
  mapButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  patientRow: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  patientName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  patientText: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 4,
  },
  addButtonContent: {
    paddingVertical: 6,
  },
});
