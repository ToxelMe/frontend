import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  getContract,
} from 'viem';
import { defineChain, webSocket, decodeEventLog } from 'viem';
import { Abi, ContractEventName } from 'viem';
import PixelBattleABI from '@/abi/PixelBattleABI.json';

export const CONTRACT_ADDRESS = '0xA2a5092e02780c025F12026F6469f8B57fDF9032';

const abi = PixelBattleABI.abi as Abi;
const STEP = 500n;
const POLL_INTERVAL = 2000;

export const flowEvmTestnet = defineChain({
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: {
    name: 'FLOW',
    symbol: 'FLOW',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://testnet.evm.nodes.onflow.org'] },
  },
});

export const client = createPublicClient({
  chain: flowEvmTestnet,
  transport: webSocket("wss://flow-testnet.g.alchemy.com/v2/AavgQutL3q53q7vlhLLCfXrmpynvNDAc"),
});

export function startPixelChangePolling(
  onLog: (log: { newOwner: string; x: bigint; y: bigint; color: string }) => void,
  fromBlock: bigint = 50267963n
) {
  let lastBlock = fromBlock;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;

    try {
      const latestBlock = await client.getBlockNumber();

      while (lastBlock <= latestBlock) {
        const toBlock = lastBlock + STEP - 1n > latestBlock ? latestBlock : lastBlock + STEP - 1n;

        const logs = await client.getLogs({
          address: CONTRACT_ADDRESS,
          abi,
          eventName: 'PixelChanged',
          fromBlock: lastBlock,
          toBlock,
        });

        logs.forEach(log => {
          try {
            const { args } = decodeEventLog({
              abi,
              eventName: 'PixelChanged',
              data: log.data,
              topics: log.topics,
            });

            if (args) {
              onLog(args as any);
            }
          } catch (e) {
            console.warn('Failed to decode log:', log, e);
          }
        });

        lastBlock = toBlock + 1n;
      }
    } catch (err) {
      console.error('Polling error:', err);
    }

    setTimeout(poll, POLL_INTERVAL);
  };

  poll();

  // Вернём функцию остановки
  return () => {
    stopped = true;
  };
}

export async function loadPastPixelChanges() {
  const latestBlock = await client.getBlockNumber();
  const fromBlock = 50267963n; // можешь адаптировать
  const step = 500n;
  const logs: any[] = [];

  for (let start = fromBlock; start <= latestBlock; start += step) {
    const end = start + step - 1n > latestBlock ? latestBlock : start + step - 1n;

    try {
      const batchLogs = await client.getLogs({
        address: CONTRACT_ADDRESS,
        abi,
        eventName: 'PixelChanged',
        fromBlock: start,
        toBlock: end,
      });

      for (const log of batchLogs) {
        try {
          const { args } = decodeEventLog({
            abi,
            eventName: 'PixelChanged',
            data: log.data,
            topics: log.topics,
          });
          logs.push(args);
        } catch (decodeErr) {
          console.warn('Decode failed for log:', log, decodeErr);
        }
      }
    } catch (err) {
      console.warn(`Error fetching logs from ${start} to ${end}`, err);
    }
  }

  return logs;
}

export async function getPixelPriceAt(x: number, y: number): Promise<bigint> {
  const contract = getContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PixelBattleABI.abi,
    client: client,
  });

  const price = await contract.read.getPixelPrice([BigInt(x), BigInt(y)]);
  return price;
}

export async function claimPixel({
  x,
  y,
  color,
}: {
  x: number;
  y: number;
  color: string; // hex string like "#ff00ff"
}) {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  const walletClient = createWalletClient({
    chain: flowEvmTestnet,
    transport: custom(window.ethereum),
  });

  const [account] = await walletClient.getAddresses();

  const contract = getContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: PixelBattleABI.abi,
    client: walletClient,
  });

  const owner: string = await contract.read.getPixelOwner([BigInt(x), BigInt(y)]);

  const price = owner.toLowerCase() === account.toLowerCase()
    ? 0n
    : await getPixelPriceAt(x, y);

  const hexColor = color.startsWith('#') ? color.slice(1) : color;
  const bytes3Color = `0x${hexColor.slice(0, 6)}` as `0x${string}`;

  const txHash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: PixelBattleABI.abi,
    functionName: 'claimPixel',
    args: [BigInt(x), BigInt(y), bytes3Color],
    account,
    value: price,
  });

  return txHash;
}
