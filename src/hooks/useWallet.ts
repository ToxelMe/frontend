import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";

export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);

  const connect = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not installed", {
        description: "Please install MetaMask to connect your wallet.",
        duration: 3000,
        position: "top-right",
      });
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);

      toast.success("Wallet connected", {
        description: `Address: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      console.error("Failed to connect wallet", err);
      toast.error("Connection failed", {
        description: "Please check MetaMask and try again.",
        duration: 3000,
        position: "top-right",
      });
    }
  };

  const disconnect = () => {
    setAddress(null);
    toast("Wallet disconnected", {
      description: "You have disconnected MetaMask.",
      duration: 2000,
      position: "top-right",
    });
  };

  useEffect(() => {
    const checkConnected = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        }
      }
    };
    checkConnected();

    window.ethereum?.on("accountsChanged", (accounts: string[]) => {
      setAddress(accounts[0] || null);
    });
  }, []);

  return {
    address,
    isConnected: !!address,
    connect,
    disconnect,
  };
};
