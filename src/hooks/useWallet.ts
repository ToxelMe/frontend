import { useEffect, useState } from "react";
import { toast } from "sonner";

const WALLET_CONNECTED_KEY = "wallet-connected";

const TARGET_CHAIN_ID = "0x221"; // например, 0x1 для Ethereum Mainnet
const TARGET_CHAIN_NAME = "FLOW"; // название для UI

export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isManuallyConnected, setIsManuallyConnected] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);

  const connect = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not installed", {
        description: "Please install MetaMask to connect your wallet.",
        duration: 1000,
        position: "bottom-left",
      });
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setChainId(currentChainId);
        setIsManuallyConnected(true);
        localStorage.setItem(WALLET_CONNECTED_KEY, "true");

        toast.success("Wallet connected", {
          description: `Address: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          duration: 1000,
          position: "bottom-left",
        });
      }
    } catch (err) {
      console.error("Failed to connect wallet", err);
      toast.error("Connection failed", {
        description: "Please check MetaMask and try again.",
        duration: 1000,
        position: "bottom-left",
      });
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsManuallyConnected(false);
    setChainId(null);
    localStorage.removeItem(WALLET_CONNECTED_KEY);
    toast("Wallet disconnected", {
      description: "You have disconnected MetaMask.",
      duration: 1000,
      position: "bottom-left",
    });
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID }],
      });
      setChainId(TARGET_CHAIN_ID);
      toast.success("Switched to correct network", {
        duration: 1000,
        position: "bottom-left",
      });
    } catch (err) {
      console.error("Failed to switch network", err);
      toast.error("Network switch failed", {
        description: "Please switch manually in MetaMask.",
        duration: 1000,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask not detected", {
        description: "Please install MetaMask to use wallet features.",
        position: "bottom-left",
      });
    }

    const wasConnected = localStorage.getItem(WALLET_CONNECTED_KEY) === "true";

    if (window.ethereum && wasConnected) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsManuallyConnected(true);
        }
      });

      window.ethereum.request({ method: "eth_chainId" }).then(setChainId);
    }

    window.ethereum?.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        disconnect();
      }
    });

    window.ethereum?.on("chainChanged", (newChainId: string) => {
      setChainId(newChainId);
    });
  }, []);

  return {
    address,
    isConnected: !!address && isManuallyConnected,
    connect,
    disconnect,
    switchNetwork,
    chainId,
    networkCorrect: chainId === TARGET_CHAIN_ID,
  };
};
