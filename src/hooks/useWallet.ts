import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ethers } from "ethers";

const WALLET_CONNECTED_KEY = "wallet-connected";

export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isManuallyConnected, setIsManuallyConnected] = useState(false);

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
      if (accounts.length > 0) {
        setAddress(accounts[0]);
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
    localStorage.removeItem(WALLET_CONNECTED_KEY);
    toast("Wallet disconnected", {
      description: "You have disconnected MetaMask.",
      duration: 1000,
      position: "bottom-left",
    });
  };

  useEffect(() => {
    const wasConnected = localStorage.getItem(WALLET_CONNECTED_KEY) === "true";

    if (window.ethereum && wasConnected) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsManuallyConnected(true);
        }
      });
    }

    // Track account changes
    window.ethereum?.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      } else {
        disconnect(); // if MetaMask disconnects at source
      }
    });
  }, []);

  return {
    address,
    isConnected: !!address && isManuallyConnected,
    connect,
    disconnect,
  };
};
