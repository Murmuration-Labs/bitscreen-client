import keccak from 'keccak';

export const getAddressHash = (input: string): string => {
  return `${keccak('keccak256').update(input.toLowerCase()).digest('hex')}`;
};

export const getOs = () => {
  let OS = 'Unknown';
  if (navigator.userAgent.indexOf('Win') != -1) OS = 'win';
  if (navigator.userAgent.indexOf('Mac') != -1) OS = 'mac';
  if (navigator.userAgent.indexOf('X11') != -1) OS = 'unix';
  if (navigator.userAgent.indexOf('Linux') != -1) OS = 'linux';
  return OS;
};
