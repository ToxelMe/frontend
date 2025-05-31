import React, { useState, useEffect } from 'react';
import { PixelCanvas } from './PixelCanvas';
import { PixelPanel } from './PixelPanel';
import { toast } from 'sonner';

interface Pixel {
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

  const GRID_SIZE = 100;

  // Initialize pixels grid
  useEffect(() => {
    const initialPixels: Pixel[][] = [];
    
    for (let x = 0; x < GRID_SIZE; x++) {
      initialPixels[x] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        initialPixels[x][y] = {
          x,
          y,
          color: '#f3f4f6', // Light gray default
          owner: 'Available',
          price: Math.floor(Math.random() * 50) + 10 // Random price 10-59
        };
      }
    }

    // Add some random colored pixels for demo
    for (let i = 0; i < 200; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
      const owners = ['User1', 'User2', 'User3', 'PixelArtist', 'CryptoFan'];
      
      initialPixels[x][y] = {
        ...initialPixels[x][y],
        color: colors[Math.floor(Math.random() * colors.length)],
        owner: owners[Math.floor(Math.random() * owners.length)]
      };
    }

    setPixels(initialPixels);
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

  const handleBuyPixel = (pixels: Pixel[], newColor: string) => {
    console.log('Buying pixel:', pixels, 'New color:', newColor);
    
    // Update pixel in grid
    setPixels(prev => {
      const newPixels = [...prev];
      pixels.forEach(pixel => {
        newPixels[pixel.x][pixel.y] = {
          ...pixel,
          color: newColor,
          owner: 'You',
          price: pixel.price + 5 // Increase price after purchase
        };
      });
      return newPixels;
    });

    // Update selected pixel
    setSelectedPixels(prev => prev.map(p =>  pixels.some(pixel => pixel.x === p.x && pixel.y === p.y) ? {
      ...p,
      color: newColor,
      owner: 'You',
      price: p.price + 5
    } : p));

    toast.success(`Pixel (${pixels[0].x}, ${pixels[0].y}) purchased successfully!`, {
      description: `New color: ${newColor}. Spent: ${pixels[0].price} FLOW`
    });
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
            {selectedPixels.length > 0 && (
              <button
                className="text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md px-4 py-2"
                onClick={() => setIsPanelOpen(true)}
              >
                Buy pixels
              </button>
            )}
          </div>
        </div>
      </header>

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
      />

      {/* Overlay when panel is open */}
      {isPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleClosePanel}
        />
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-600 max-w-xs">
        <p className="mb-1"><strong>Controls:</strong></p>
        <p>• Left Click - select pixel</p>
        <p>• Scroll Wheel - zoom</p>
        <p>• Right/Middle Click - move</p>
      </div>

    </div>
  );
};
