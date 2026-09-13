import { SegmentedButtons } from 'react-native-paper';

import type { OrganizationType } from '../types/auth.types';

type OrganizationTypeToggleProps = {
  value: OrganizationType;
  onChange: (value: OrganizationType) => void;
};

export function OrganizationTypeToggle({
  value,
  onChange,
}: OrganizationTypeToggleProps) {
  return (
    <SegmentedButtons
      value={value}
      onValueChange={(newValue) => onChange(newValue as OrganizationType)}
      buttons={[
        { value: 'INDEPENDENT', label: 'Veterinario independiente' },
        { value: 'CLINIC', label: 'Clínica' },
      ]}
    />
  );
}
