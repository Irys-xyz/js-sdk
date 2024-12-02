import argentAbi from '../abi/argent.abi.json';
import braavosAbi from '../abi/braavos.abi.json';

export const ID = [
  {
    id: 1,
    name: 'Argent',
    abi: argentAbi,
    selector: 'get_owner',
    version: '1.0.0',
  },
  {
    id: 2,
    name: 'Braavos',
    abi: braavosAbi,
    selector: 'get_public_key',
    version: '1.0.0',
  },
];
