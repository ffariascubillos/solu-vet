import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, Text, TouchableRipple } from 'react-native-paper';

type SelectFieldOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: SelectFieldOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
};

export function SelectField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  disabled,
}: SelectFieldProps) {
  const [visible, setVisible] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <View style={styles.group}>
      <Text variant="labelLarge" style={styles.label}>
        {label}
      </Text>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TouchableRipple
            onPress={() => !disabled && setVisible(true)}
            disabled={disabled}
            style={[styles.anchor, disabled && styles.anchorDisabled]}>
            <Text style={selectedLabel ? styles.value : styles.placeholder}>
              {selectedLabel || placeholder}
            </Text>
          </TouchableRipple>
        }>
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            title={option.label}
            onPress={() => {
              onSelect(option.value);
              setVisible(false);
            }}
          />
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 4,
    marginTop: 4,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  anchor: {
    backgroundColor: '#0F172A',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  anchorDisabled: {
    opacity: 0.5,
  },
  value: {
    color: '#fff',
  },
  placeholder: {
    color: '#94A3B8',
  },
});
