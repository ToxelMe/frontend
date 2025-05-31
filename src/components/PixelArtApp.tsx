import React, { useState, useEffect } from 'react';
import { PixelCanvas } from './PixelCanvas';
import { PixelPanel } from './PixelPanel';
import { toast } from 'sonner';
import { buyPixel } from '@/services/pixelService';
import { useWallet } from '@/hooks/useWallet';
import { watchPixelChanges } from '@/lib/contract';
import { loadPastPixelChanges } from '@/lib/contract';
import { startPixelChangePolling } from '@/lib/contract';

export interface Pixel {
  x: number;
  y: number;
  color: string;
  owner: string;
  price: number;
}

const GRID_SIZE = 100;

export const PixelArtApp: React.FC = () => {
  const [pixels, setPixels] = useState<Pixel[][]>([]);
  const [selectedPixels, setSelectedPixels] = useState<Pixel[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const wallet = useWallet();

  useEffect(() => {
    const initialPixels: Pixel[][] = Array.from({ length: GRID_SIZE }, (_, x) =>
      Array.from({ length: GRID_SIZE }, (_, y) => ({
        x,
        y,
        color: '#ffffff',
        owner: '',
        price: 0.0,
      }))
    );
    setPixels(initialPixels);
  }, []);

  useEffect(() => {
    const handleLog = ({ newOwner, x, y, color }: any) => {
      const px = Number(x);
      const py = Number(y);
      const hexColor = '#' + color.slice(2);

      setPixels(prev => {
        const updated = [...prev];
        if (updated[px]?.[py]) {
          updated[px][py] = {
            ...updated[px][py],
            color: hexColor,
            owner: newOwner,
          };
        }
        return updated;
      });
    };

    const stopPolling = startPixelChangePolling(handleLog);

    return () => {
      stopPolling();
    };
  }, []);

  const handlePixelClick = (pixel: Pixel, event: React.MouseEvent) => {
    if (event.shiftKey) {
      setSelectedPixels(prev => {
        if (!prev.some(p => p.x === pixel.x && p.y === pixel.y)) {
          return [...prev, pixel];
        }
        return prev;
      });
    } else {
      setSelectedPixels([pixel]);
      setIsPanelOpen(true);
    }
  };

  const handleBuyPixel = async (pixelsToBuy: Pixel[], newColor: string) => {
    if (!wallet.isConnected || !wallet.address) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet before buying a pixel.',
      });
      return;
    }

    try {
      const updatedPixels = await buyPixel(pixelsToBuy, newColor, wallet.address);
      setPixels(prev => {
        const newPixels = [...prev];
        updatedPixels.forEach(pixel => {
          newPixels[pixel.x][pixel.y] = {
            ...pixel,
            color: newColor,
            owner: 'You',
            price: pixel.price + 5,
          };
        });
        return newPixels;
      });
      setSelectedPixels(updatedPixels);
      toast.success('Pixels purchased successfully!', {
        description: `New color: ${newColor}. Spent: ${pixelsToBuy.reduce((sum, p) => sum + p.price, 0)} FLOW`,
        duration: 1500,
        position: 'bottom-left',
      });
    } catch {
      toast.error('Failed to buy pixel');
    }
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedPixels([]);
  };

  if (pixels.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pixel field...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-50">
      {/* header, canvas, panel, etc. as before */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/public/logo.png" alt="Toxel Logo" className="h-12 w-auto" />
            <p className="text-sm text-gray-600 ml-3">Draw. Battle. Earn.</p>
          </div>
          <div className="flex items-center gap-4">
            {!wallet.isConnected ? (
              <button onClick={wallet.connect} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold shadow transition">
                Connect wallet
              </button>
            ) : (
              <>
                {wallet.networkCorrect ? (
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                    <img src="/flow-logo.svg" alt="Flow" className="w-4 h-4" />
                    Flow
                  </div>
                ) : (
                  <button onClick={wallet.switchNetwork} className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition">
                    Switch to Flow
                  </button>
                )}
                <button onClick={wallet.disconnect} className="text-sm text-gray-600 hover:text-red-600 transition" title="Click to disconnect">
                  Connected: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

       {selectedPixels.length > 0 && (
        <button className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg transition-all" onClick={() => setIsPanelOpen(true)}>
          Buy pixels
        </button>
      )}

      <div className="pt-20 h-full">
        <PixelCanvas
          pixels={pixels}
          selectedPixels={selectedPixels}
          onPixelClick={handlePixelClick}
        />
      </div>

      <PixelPanel
        pixels={selectedPixels}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onBuyPixel={handleBuyPixel}
        wallet={wallet}
      />

      {isPanelOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={handleClosePanel} />
      )}
    </div>
  );
};
