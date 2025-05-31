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
  const [selectedPixels, setSelectedPixels] = useState<Pixel[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const GRID_SIZE = 300;
  const wallet = useWallet(); // 👉 подключаем хук

  useEffect(() => {
    setPixels(generateMockPixels(GRID_SIZE));
  }, []);

  const handlePixelClick = (pixel: Pixel, event: React.MouseEvent) => {
    console.log('Pixel clicked:', pixel);
    console.log('Shift key pressed:', event.shiftKey);
    if (event.shiftKey) {
      setSelectedPixels(prev => {
        if (!prev.some(p => p.x === pixel.x && p.y === pixel.y)) {
          return [...prev, pixel];
        }
        return prev;
      });
      console.log('Selected multiple pixels: ', selectedPixels)
    } else {
      setSelectedPixels([pixel]);
      console.log('Selected single pixels: ', selectedPixels)
      setIsPanelOpen(true);
    }
  };

  const handleBuyPixel = async (pixels: Pixel[], newColor: string) => {
    if (!wallet.isConnected || !wallet.address) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet before buying a pixel.",
      });
      return;
    }

    try {
      const updatedPixels = await buyPixel(pixels, newColor, wallet.address); // передаём реальный адрес
      setPixels(prev => {
          const newPixels = [...prev];
          updatedPixels.forEach(pixel => {
            newPixels[pixel.x][pixel.y] = {
              ...pixel,
              color: newColor,
              owner: 'You',
              price: pixel.price + 5 // Increase price after purchase
            };
          });
          return newPixels;
        });
      setSelectedPixels(updatedPixels);
      toast.success(pixels.length > 1 ? `Pixels purchased successfully!` : `Pixel (${pixels[0].x}, ${pixels[0].y}) purchased successfully!`, {
        description: `New color: ${newColor}. Spent: ${pixels.reduce((total, pixel) => total + pixel.price, 0)} FLOW`,
        duration: 1500,
        position: 'bottom-left'
      });
    } catch (err) {
      toast.error("Failed to buy pixel");
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
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {selectedPixels.length > 0 && (
        <button
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg transition-all"
          onClick={() => setIsPanelOpen(true)}
        >
          Buy pixels
        </button>
      )}

      {/* Canvas */}
      <div className="pt-20 h-full">
        <PixelCanvas
          pixels={pixels}
          selectedPixels={selectedPixels}
          onPixelClick={handlePixelClick}
        />
      </div>

      {/* Side Panel */}
      <PixelPanel
        pixels={selectedPixels}
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
