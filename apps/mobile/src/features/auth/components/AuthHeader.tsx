import { StyleSheet, View } from 'react-native';
import { Avatar, Text } from 'react-native-paper';

import { colors } from '@/src/theme/colors';

type AuthHeaderProps = {
  title: string;
  subtitle: string;
};

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.header}>
      <Avatar.Text
        size={72}
        label="S"
        style={styles.badge}
        labelStyle={styles.badgeLabel}
      />
      <Text variant="headlineMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  badge: {
    backgroundColor: colors.primary,
    marginBottom: 10,
  },
  badgeLabel: {
    color: colors.text,
    fontWeight: 'bold',
  },
  title: {
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },
});
