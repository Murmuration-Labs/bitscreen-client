import keccak from 'keccak';

export const getAddressHash = (input: string): string => {
  return `${keccak('keccak256').update(input.toLowerCase()).digest('hex')}`;
};
