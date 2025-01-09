import { Result } from 'starknet';
import argentAbi from '../abi/argent.abi.json';
import braavosAbi from '../abi/braavos.abi.json';

const hexStringPostProcessor = (result: Result): Buffer => {
  const result2 = (result as any[])[0];
  if(!(typeof result2 === "string")) throw new Error(`Incorrect result ${result2}, expected hex string`);
  return Buffer.from(result2.startsWith("0x") ? result2.slice(2) : result2, "hex")
}

export const KnownAccountContracts = new Map(
  [
    [1,{
  name: 'Argent',
  abi: argentAbi,
  selector: 'get_owner',
  version: '1.0.0',
  postProcessor: hexStringPostProcessor
  } ],
 [2, {
  name: 'Braavos',
  abi: braavosAbi,
  selector: 'get_public_key',
  version: '1.0.0',
  postProcessor: hexStringPostProcessor

}]
])
