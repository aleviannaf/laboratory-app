import { mapToCreateInput } from './patients.component';

describe('mapToCreateInput', () => {
  const validSubmitResult = {
    type: 'submit' as const,
    payload: {
      fullName: '  Maria Souza  ',
      cpf: '123.456.789-00',
      birthDate: ' 1990-10-01 ',
      phone: ' (11) 99999-9999 ',
      email: 'maria@example.com',
      address: ' Rua A, 100 ',
    },
  };

  it('maps submit payload to CreatePatientInput with trimmed strings', () => {
    const input = mapToCreateInput(validSubmitResult);

    expect(input).toEqual({
      full_name: 'Maria Souza',
      birth_date: '1990-10-01',
      sex: 'N/A',
      phone: '(11) 99999-9999',
      address: 'Rua A, 100',
    });
  });

  it('throws when full name is empty', () => {
    const result = {
      ...validSubmitResult,
      payload: { ...validSubmitResult.payload, fullName: '   ' },
    };

    expect(() => mapToCreateInput(result)).toThrowError('Nome e obrigatorio.');
  });

  it('never returns null for string fields', () => {
    const result = {
      ...validSubmitResult,
      payload: {
        ...validSubmitResult.payload,
        birthDate: null as unknown as string,
        phone: null as unknown as string,
        address: null as unknown as string,
      },
    };

    expect(() => mapToCreateInput(result)).toThrowError('Nascimento e obrigatorio.');
  });
});
