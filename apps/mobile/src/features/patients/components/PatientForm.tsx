import { StyleSheet, View } from 'react-native';
import {
  Avatar,
  Card,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';

import type { CreatePatientInput } from '@/src/types/patient';
import type { PatientForm as PatientFormState } from '../registration.types';

type PatientFormProps = {
  form: PatientFormState;
  onChangeField: <K extends keyof PatientFormState>(
    field: K,
    value: PatientFormState[K],
  ) => void;
};

export function PatientForm({ form, onChangeField }: PatientFormProps) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Title
        title="Datos del paciente"
        left={(props) => (
          <Avatar.Icon {...props} icon="dog" style={styles.avatarPatient} />
        )}
      />
      <Card.Content style={styles.cardContent}>
        <TextInput
          style={styles.input}
          label="Nombre mascota"
          mode="outlined"
          value={form.firstName}
          onChangeText={(value) => onChangeField('firstName', value)}
        />

        <View style={styles.selectorGroup}>
          <Text variant="labelLarge" style={styles.label}>
            Sexo
          </Text>
          <SegmentedButtons
            value={form.sex}
            onValueChange={(value) =>
              onChangeField('sex', value as CreatePatientInput['sex'])
            }
            buttons={[
              { value: 'FEMALE', label: 'Hembra', icon: 'gender-female' },
              { value: 'MALE', label: 'Macho', icon: 'gender-male' },
            ]}
          />
        </View>

        <TextInput
          style={styles.input}
          label="Edad"
          mode="outlined"
          keyboardType="number-pad"
          value={form.age}
          onChangeText={(value) => onChangeField('age', value)}
        />
        <TextInput
          style={styles.input}
          label="Especie"
          mode="outlined"
          value={form.species}
          onChangeText={(value) => onChangeField('species', value)}
        />
        <TextInput
          style={styles.input}
          label="Raza"
          mode="outlined"
          value={form.breed}
          onChangeText={(value) => onChangeField('breed', value)}
        />

        <View style={styles.selectorGroup}>
          <Text variant="labelLarge" style={styles.label}>
            Estado reproductivo
          </Text>
          <SegmentedButtons
            value={form.reproductiveStatus}
            onValueChange={(value) =>
              onChangeField(
                'reproductiveStatus',
                value as CreatePatientInput['reproductiveStatus'],
              )
            }
            buttons={[
              { value: 'NOT_STERILIZED', label: 'No esterilizado' },
              { value: 'STERILIZED', label: 'Esterilizado' },
            ]}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  cardContent: {
    gap: 12,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0F172A',
  },
  avatarPatient: {
    backgroundColor: '#22C55E',
  },
  selectorGroup: {
    marginBottom: 4,
    marginTop: 4,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
});
