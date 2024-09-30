import { canUploadAptos } from "./tokens/aptos";
import { canUploadArbitrum } from "./tokens/arbitrum";
import { canUploadAvalanche } from "./tokens/avalanche";
import { canUploadBera } from "./tokens/bera";
import { canUploadBnb } from "./tokens/bnb";
import { canUploadEclipseEth } from "./tokens/eclipse-ethereum";
import { canUploadEthereum } from "./tokens/ethereum";
import { canUploadBaseEthereum } from "./tokens/base-ethereum";
import { canUploadLineaEthereum } from "./tokens/linea-ethereum";
import { canUploadScrollEthereum } from "./tokens/scroll-ethereum";
import { canUploadIotex } from "./tokens/iotex";
import { canUploadPolygon } from "./tokens/polygon";
import { canUploadUsdcEth } from "./tokens/usdcEth";
import { canUploadUsdcPolygon } from "./tokens/usdcPolygon";
import { canUploadChainlink } from "./tokens/chainlink";
import { canUploadSolana } from "./tokens/solana";

const runTests = async () => {

  // Aptos
  const aptosResult = await canUploadAptos();
  if (aptosResult) console.log("Aptos upload test passed.");
  else console.log("Aptos upload test failed.");

  // Arbitrum
  const arbitrumResult = await canUploadArbitrum();
  if (arbitrumResult) console.log("Arbitrum upload test passed.");
  else console.log("Arbitrum upload test failed.");

  // Avalanche C-Chain
  const avalancheResult = await canUploadAvalanche();
  if (avalancheResult) console.log("Avalanche upload test passed.");
  else console.log("Avalanche upload test failed.");

  // Bera
  const beraResult = await canUploadBera();
  if (beraResult) console.log("Bera upload test passed.");
  else console.log("Bera upload test failed.");

  // BNB
  const bnbResult = await canUploadBnb();
  if (bnbResult) console.log("BNB upload test passed.");
  else console.log("BNB upload test failed.");

  // Chainlink
  const chainlinkResult = await canUploadChainlink();
  if (chainlinkResult) console.log("Chainlink upload test passed.");
  else console.log("Chainlink upload test failed.");

  // Eclipse-eth
  const eclipseEthResult = await canUploadEclipseEth();
  if (eclipseEthResult) console.log("Eclipse-eth upload test passed.");
  else console.log("Eclipse-eth upload test failed.");

  // Ethereum
  const ethereumResult = await canUploadEthereum();
  if (ethereumResult) console.log("Ethereum upload test passed.");
  else console.log("Ethereum upload test failed.");

  // Base Ethereum
  const baseEthereumResult = await canUploadBaseEthereum();
  if (baseEthereumResult) console.log("Base Ethereum upload test passed.");
  else console.log("Base Ethereum upload test failed.");

  // Linea Ethereum
  const lineaEthereumResult = await canUploadLineaEthereum();
  if (lineaEthereumResult) console.log("Linea Ethereum upload test passed.");
  else console.log("Linea Ethereum upload test failed.");

  // Scroll Ethereum
  const scrollEthereumResult = await canUploadScrollEthereum();
  if (scrollEthereumResult) console.log("Scroll Ethereum upload test passed.");
  else console.log("Scroll Ethereum upload test failed.");

  // IoTeX
  const iotexResult = await canUploadIotex();
  if (iotexResult) console.log("IoTeX upload test passed.");
  else console.log("IoTeX upload test failed.");

  // Polygon
  const polygonResult = await canUploadPolygon();
  if (polygonResult) console.log("Polygon upload test passed.");
  else console.log("Polygon upload test failed.");

  // Solana
  const solanaResult = await canUploadSolana();
  if (solanaResult) console.log("Solana upload test passed.");
  else console.log("Solana upload test failed.");

  // USDC on Ethereum
  const usdcEthResult = await canUploadUsdcEth();
  if (usdcEthResult) console.log("USDC on Ethereum upload test passed.");
  else console.log("USDC on Ethereum upload test failed.");

  // USDC on Polygon
  const usdcPolygonResult = await canUploadUsdcPolygon();
  if (usdcPolygonResult) console.log("USDC on Polygon upload test passed.");
  else console.log("USDC on Polygon upload test failed.");
 
 
};

runTests().catch((err) => console.error("Unexpected error during testing:", err));
