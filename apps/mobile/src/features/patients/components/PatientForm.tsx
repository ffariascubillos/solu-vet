import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Avatar,
  Card,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';

import { getBreeds, getSpecies } from '../patients.service';
import { SelectField } from './SelectField';

import type { Breed, CreatePatientInput, Species } from '@/src/types/patient';
import type { PatientForm as PatientFormState } from '../registration.types';

type PatientFormProps = {
  form: PatientFormState;
  onChangeField: <K extends keyof PatientFormState>(
    field: K,
    value: PatientFormState[K],
  ) => void;
};

export function PatientForm({ form, onChangeField }: PatientFormProps) {
  const [speciesOptions, setSpeciesOptions] = useState<Species[]>([]);
  const [breedOptions, setBreedOptions] = useState<Breed[]>([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSpecies() {
      try {
        const results = await getSpecies();
        if (isActive) setSpeciesOptions(results);
      } catch {
        if (isActive) setSpeciesOptions([]);
      }
    }

    loadSpecies();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!form.speciesId) {
      setBreedOptions([]);
      return;
    }

    let isActive = true;

    async function loadBreeds(speciesId: string) {
      try {
        setLoadingBreeds(true);
        const results = await getBreeds(speciesId);
        if (isActive) setBreedOptions(results);
      } catch {
        if (isActive) setBreedOptions([]);
      } finally {
        if (isActive) setLoadingBreeds(false);
      }
    }

    loadBreeds(form.speciesId);

    return () => {
      isActive = false;
    };
  }, [form.speciesId]);

  function handleSpeciesChange(value: string) {
    onChangeField('speciesId', value);
    onChangeField('breedId', '');
  }

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

        <SelectField
          label="Especie"
          value={form.speciesId}
          placeholder="Selecciona una especie"
          options={speciesOptions.map((species) => ({
            value: species.id,
            label: species.name,
          }))}
          onSelect={handleSpeciesChange}
        />

        <SelectField
          label="Raza"
          value={form.breedId}
          placeholder={
            form.speciesId
              ? 'Selecciona una raza'
              : 'Selecciona una especie primero'
          }
          options={breedOptions.map((breed) => ({
            value: breed.id,
            label: breed.name,
          }))}
          onSelect={(value) => onChangeField('breedId', value)}
          disabled={!form.speciesId || loadingBreeds}
        />
        {loadingBreeds ? (
          <HelperText type="info" visible>
            Cargando razas...
          </HelperText>
        ) : null}

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
