import { Result } from 'starknet';

const hexStringPostProcessor = (result: Result): Buffer => {
  const result2 = (result as any[])[0];
  if (!(typeof result2 === 'string'))
    throw new Error(`Incorrect result ${result2}, expected hex string`);
  return Buffer.from(
    result2.startsWith('0x') ? result2.slice(2) : result2,
    'hex'
  );
};

export const KnownAccountContracts = new Map([
  [
    1,
    {
      name: 'Argent',
      abi: [
        {
          name: 'argent::account::interface::IArgentUserAccount',
          type: 'interface',
          items: [
            {
              name: 'get_owner',
              type: 'function',
              inputs: [],
              outputs: [
                {
                  type: 'core::felt252',
                },
              ],
              state_mutability: 'view',
            },
          ],
        },
      ],
      selector: 'get_owner',
      version: '1.0.0',
      postProcessor: hexStringPostProcessor,
    },
  ],
  [
    2,
    {
      name: 'Braavos',
      abi: [
        {
          name: 'braavos_account::signers::interface::ISignerManagement',
          type: 'interface',
          items: [
            {
              name: 'get_public_key',
              type: 'function',
              inputs: [],
              outputs: [
                {
                  type: 'core::felt252',
                },
              ],
              state_mutability: 'view',
            },
          ],
        },
      ],
      selector: 'get_public_key',
      version: '1.0.0',
      postProcessor: hexStringPostProcessor,
    },
  ],
]);
