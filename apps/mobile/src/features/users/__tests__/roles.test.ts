import { invitableRoles, roleLabels } from '../roles';

describe('roleLabels', () => {
  it.each([
    ['OWNER', 'Propietario'],
    ['VETERINARIAN', 'Médico veterinario'],
    ['RECEPTIONIST', 'Recepcionista'],
    ['ASSISTANT', 'Asistente / TENS veterinario'],
  ] as const)('%s se muestra como "%s"', (role, label) => {
    expect(roleLabels[role]).toBe(label);
  });

  it('cubre exactamente los cuatro roles', () => {
    expect(Object.keys(roleLabels).sort()).toEqual(
      ['ASSISTANT', 'OWNER', 'RECEPTIONIST', 'VETERINARIAN']
    );
  });
});

describe('invitableRoles', () => {
  it('ofrece los cargos del personal con etiqueta y excluye OWNER', () => {
    expect(invitableRoles).toEqual(['VETERINARIAN', 'RECEPTIONIST', 'ASSISTANT']);
    expect(invitableRoles).not.toContain('OWNER');

    for (const role of invitableRoles) {
      expect(roleLabels[role]).toBeTruthy();
    }
  });
});
