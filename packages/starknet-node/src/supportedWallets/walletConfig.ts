import argentAbi from "../abi/argent.abi.json";
import braavosAbi from "../abi/braavos.abi.json";

export const walletConfigs = [
    {
      name: 'Argent',
      abi: argentAbi,
      selector: 'get_owner',
    },
    {
      name: 'Braavos',
      abi: braavosAbi,
      selector: 'get_public_key',
    },
  ];
  