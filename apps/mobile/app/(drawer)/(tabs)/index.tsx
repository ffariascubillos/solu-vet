import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Avatar, Surface, TouchableRipple } from 'react-native-paper';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADER CON AVATAR */}
      <View style={styles.headerUser}>
        <View>
          <Text variant="headlineSmall" style={styles.welcomeText}>
            ¡Buen día!
          </Text>
          <Text
            variant="titleMedium"
            style={{
              marginTop: 8,
              marginLeft: 8,
              color: '#22C55E',
              fontWeight: 'bold',
            }}>
            Dra. Lola
          </Text>
        </View>
        <Avatar.Image
          size={60}
          source={{ uri: 'https://i.pravatar.cc/150?img=5' }}
        />
      </View>

      <Text variant="bodyMedium" style={styles.sectionTitle}>
        ACCESO RÁPIDO
      </Text>

      {/* BOTONES TIPO GRILLA (SURFACES) */}
      <View style={styles.grid}>
        <Link href="/patients/search" asChild>
          <TouchableRipple style={styles.cardWrapper}>
            <Surface style={styles.card} elevation={1}>
              <MaterialCommunityIcons name="dog" size={30} color="#22C55E" />
              <Text style={styles.cardText}>Pacientes</Text>
            </Surface>
          </TouchableRipple>
        </Link>

        <Link href="/patients/create" asChild>
          <TouchableRipple style={styles.cardWrapper}>
            <Surface style={styles.card} elevation={1}>
              <MaterialCommunityIcons
                name="plus-box"
                size={30}
                color="#38BDF8"
              />
              <Text style={styles.cardText}>Registrar</Text>
            </Surface>
          </TouchableRipple>
        </Link>
      </View>

      {/* TARJETA DE RESUMEN */}
      <Surface style={styles.summaryCard} elevation={2}>
        <View style={styles.summaryRow}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={24}
            color="#94A3B8"
          />
          <Text style={styles.summaryTitle}>Citas para hoy</Text>
        </View>
        <Text style={styles.summaryCount}>8 Pacientes</Text>
        <Text style={styles.summarySub}>
          Siguiente:{' '}
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Luna</Text>{' '}
          (Golden Retriever) - 10:30 AM
        </Text>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
  },
  headerUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    color: '#F8FAFC',
    opacity: 0.8,
  },
  sectionTitle: {
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    color: '#F8FAFC',
    marginTop: 8,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  summaryTitle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  summaryCount: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summarySub: {
    color: '#64748B',
    marginTop: 5,
    fontSize: 12,
  },
});
