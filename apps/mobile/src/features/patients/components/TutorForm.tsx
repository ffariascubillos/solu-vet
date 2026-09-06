import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Card, HelperText, TextInput } from 'react-native-paper';

import { getRegions } from '../patients.service';
import { SelectField } from './SelectField';

import type { Region } from '@/src/types/patient';
import type { TutorFieldErrors, TutorForm as TutorFormState } from '../registration.types';

type TutorFormProps = {
  form: TutorFormState;
  fieldErrors: TutorFieldErrors;
  onChangeField: (field: keyof TutorFormState, value: string) => void;
};

export function TutorForm({ form, fieldErrors, onChangeField }: TutorFormProps) {
  const [regionOptions, setRegionOptions] = useState<Region[]>([]);

  useEffect(() => {
    let isActive = true;

    async function loadRegions() {
      try {
        const results = await getRegions();
        if (isActive) setRegionOptions(results);
      } catch {
        if (isActive) setRegionOptions([]);
      }
    }

    loadRegions();

    return () => {
      isActive = false;
    };
  }, []);

  const comunaOptions =
    regionOptions.find((region) => region.name === form.region)?.comunas ?? [];

  function handleRegionChange(value: string) {
    onChangeField('region', value);
    onChangeField('comuna', '');
  }

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Title
        title="Datos del tutor"
        left={(props) => (
          <Avatar.Icon {...props} icon="account" style={styles.avatarTutor} />
        )}
      />
      <Card.Content style={styles.cardContent}>
        <TextInput
          style={styles.input}
          label="Nombre"
          mode="outlined"
          value={form.firstName}
          onChangeText={(value) => onChangeField('firstName', value)}
        />
        <TextInput
          style={styles.input}
          label="Apellido"
          mode="outlined"
          value={form.lastName}
          onChangeText={(value) => onChangeField('lastName', value)}
        />
        <SelectField
          label="Región"
          value={form.region}
          placeholder="Selecciona una región"
          options={regionOptions.map((region) => ({
            value: region.name,
            label: region.name,
          }))}
          onSelect={handleRegionChange}
        />

        <SelectField
          label="Comuna"
          value={form.comuna}
          placeholder={
            form.region ? 'Selecciona una comuna' : 'Selecciona una región primero'
          }
          options={comunaOptions.map((comuna) => ({
            value: comuna,
            label: comuna,
          }))}
          onSelect={(value) => onChangeField('comuna', value)}
          disabled={!form.region}
        />

        <TextInput
          style={styles.input}
          label="Calle y número"
          mode="outlined"
          value={form.streetAddress}
          onChangeText={(value) => onChangeField('streetAddress', value)}
        />

        <TextInput
          style={styles.input}
          label="Complemento (Casa, Depto, Piso, etc.)"
          mode="outlined"
          value={form.addressComplement}
          onChangeText={(value) => onChangeField('addressComplement', value)}
        />

        <View>
          <TextInput
            style={styles.input}
            label="Correo electrónico"
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) => onChangeField('email', value)}
            error={!!fieldErrors.email}
          />
          {fieldErrors.email && (
            <HelperText type="error">{fieldErrors.email}</HelperText>
          )}
        </View>

        <TextInput
          style={styles.input}
          label="Teléfono"
          mode="outlined"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(value) => onChangeField('phone', value)}
        />

        <View>
          <TextInput
            style={styles.input}
            label="RUT"
            mode="outlined"
            placeholder="12345678-9"
            autoCapitalize="characters"
            value={form.rut}
            onChangeText={(value) => onChangeField('rut', value)}
            error={!!fieldErrors.rut}
          />
          {fieldErrors.rut ? (
            <HelperText type="error">{fieldErrors.rut}</HelperText>
          ) : (
            <HelperText type="info" visible>
              Formato: 12345678-9 (con guión, sin puntos)
            </HelperText>
          )}
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
  avatarTutor: {
    backgroundColor: '#0284C7',
  },
});
