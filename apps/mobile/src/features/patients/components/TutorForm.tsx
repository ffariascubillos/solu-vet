import { StyleSheet, View } from 'react-native';
import { Avatar, Card, HelperText, TextInput } from 'react-native-paper';

import type { TutorFieldErrors, TutorForm as TutorFormState } from '../registration.types';

type TutorFormProps = {
  form: TutorFormState;
  fieldErrors: TutorFieldErrors;
  onChangeField: (field: keyof TutorFormState, value: string) => void;
};

export function TutorForm({ form, fieldErrors, onChangeField }: TutorFormProps) {
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
        <TextInput
          style={styles.input}
          label="Dirección"
          mode="outlined"
          value={form.address}
          onChangeText={(value) => onChangeField('address', value)}
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
            autoCapitalize="characters"
            value={form.rut}
            onChangeText={(value) => onChangeField('rut', value)}
            error={!!fieldErrors.rut}
          />
          {fieldErrors.rut && (
            <HelperText type="error">{fieldErrors.rut}</HelperText>
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
