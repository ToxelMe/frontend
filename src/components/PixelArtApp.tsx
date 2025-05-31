import React, { useState, useEffect } from 'react';
import { PixelCanvas } from './PixelCanvas';
import { PixelPanel } from './PixelPanel';
import { toast } from 'sonner';
import { buyPixel } from '@/services/pixelService';
import { generateMockPixels } from '../mocks/pixelMocks';
import { useWallet } from '@/hooks/useWallet';

export interface Pixel {
  x: number;
  y: number;
  color: string;
  owner: string;
  price: number;
}

export const PixelArtApp: React.FC = () => {
  const [pixels, setPixels] = useState<Pixel[][]>([]);
  const [selectedPixel, setSelectedPixel] = useState<Pixel | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const GRID_SIZE = 300;
  const wallet = useWallet(); // 👉 подключаем хук

  useEffect(() => {
    setPixels(generateMockPixels(GRID_SIZE));
  }, []);

  const handlePixelClick = (pixel: Pixel) => {
    console.log('Pixel clicked:', pixel);
    setSelectedPixel(pixel);
    setIsPanelOpen(true);
  };

  const handleBuyPixel = async (pixel: Pixel, newColor: string) => {
    if (!wallet.isConnected || !wallet.address) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet before buying a pixel.",
      });
      return;
    }

    try {
      const updatedPixel = await buyPixel(pixel, newColor, wallet.address); // передаём реальный адрес
      setPixels(prev => {
        const newPixels = [...prev];
        newPixels[pixel.x][pixel.y] = updatedPixel;
        return newPixels;
      });
      setSelectedPixel(updatedPixel);
      toast.success(`Pixel (${pixel.x}, ${pixel.y}) purchased successfully!`, {
        description: `New color: ${newColor}. Spent: ${pixel.price} FLOW`,
        duration: 1500,
        position: 'bottom-left'
      });
    } catch (err) {
      toast.error("Failed to buy pixel");
    }
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedPixel(null);
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
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Toxel</h1>
              <p className="text-sm text-gray-600">Draw. Battle. Earn.</p>
            </div>
            <div className="text-right">
              {!wallet.isConnected ? (
                <button
                  onClick={wallet.connect}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold shadow transition"
                >
                  Connect wallet
                </button>
              ) : (
                <div className="flex flex-col items-end space-y-1">
                  <button
                    onClick={wallet.disconnect}
                    className="text-sm text-gray-600 hover:text-red-600 transition"
                    title="Click to disconnect"
                  >
                    Connected: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </button>
                  <p className="text-xs text-gray-500">Tap a pixel to buy</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="pt-20 h-full">
        <PixelCanvas
          pixels={pixels}
          selectedPixel={selectedPixel}
          onPixelClick={handlePixelClick}
        />
      </div>

      {/* Side Panel */}
      <PixelPanel
        pixel={selectedPixel}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onBuyPixel={handleBuyPixel}
        wallet={wallet}
      />

      {/* Overlay when panel is open */}
      {isPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleClosePanel}
        />
      )}
    </div>
  );
};
