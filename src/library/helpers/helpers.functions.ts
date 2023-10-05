import keccak from 'keccak';
import { NetworkType } from 'pages/Filters/Interfaces';

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

export const abbreviateNetwork = (networkType: NetworkType) => {
  switch (networkType) {
    case NetworkType.Filecoin:
      return 'FIL';

    case NetworkType.IPFS:
      return 'IPFS';
  }
};
