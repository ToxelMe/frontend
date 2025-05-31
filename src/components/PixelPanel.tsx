import React, { useState, useRef, useEffect } from 'react';
import { X, Palette, User, DollarSign, ShoppingCart } from 'lucide-react';
import { Pixel } from './PixelArtApp';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import { claimPixel, getPixelPriceAt } from '@/lib/contract';

interface PixelPanelProps {
  pixels: Pixel[];
  onClose: () => void;
  isOpen: boolean;
  wallet: ReturnType<typeof useWallet>;
}

const COLORS = [
  '#022b7a', '#710461', '#a02c5d', '#ec0e47', '#ee6c3b', '#fcbf54',
  '#abd96d', '#14c285', '#077353', '#055459', '#26294a', '#1a1334', '#f8f9fa'
];

// Функция для форматирования wei в FLOW
const formatFlow = (wei: bigint): string => (Number(wei) / 1e18).toFixed(6);

export const PixelPanel: React.FC<PixelPanelProps> = ({
  pixels,
  onClose,
  isOpen,
  wallet
}) => {
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [localPixels, setLocalPixels] = useState<Pixel[]>([]);

  useEffect(() => {
    if (showColorPicker && colorInputRef.current) {
      colorInputRef.current.click();
    }
  }, [showColorPicker]);

  useEffect(() => {
    const fetchPrices = async () => {
      const updated = await Promise.all(
        pixels.map(async (pixel) => {
          try {
            const price = await getPixelPriceAt(pixel.x, pixel.y);
            return { ...pixel, price };
          } catch (e) {
            console.error(`Failed to get price for (${pixel.x}, ${pixel.y})`, e);
            return { ...pixel, price: BigInt(0) };
          }
        })
      );
      setLocalPixels(updated);
    };

    if (isOpen && pixels.length > 0) {
      fetchPrices();
    }
  }, [isOpen, pixels]);

  const handleBuy = async () => {
    if (!wallet.address || !wallet.networkCorrect) {
      toast.error("Wallet not connected or wrong network");
      return;
    }

    try {
      setLoading(true);
      for (const pixel of localPixels) {
        await claimPixel({
          x: pixel.x,
          y: pixel.y,
          color: selectedColor
        });
      }
      toast.success("Pixels claimed!");
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Transaction failed", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || localPixels.length === 0) return null;

  const isOwned = localPixels.some(pixel => pixel.owner !== 'Available');
  const isMultipleOwners = new Set(localPixels.map(p => p.owner)).size > 1;

  // 💰 Правильное BigInt сложение
  const totalPrice = localPixels.reduce(
    (total, pixel) => total + (pixel.price || BigInt(0)),
    BigInt(0)
  );

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    } z-50`}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {localPixels.length === 1
              ? `Toxel (${localPixels[0].x}, ${localPixels[0].y})`
              : 'Multiple pixels'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg border-2 border-gray-300"
            style={{ backgroundColor: localPixels[0].color }}
          />
          <div>
            <p className="text-sm text-gray-600">Current color</p>
            <p className="font-mono text-sm">{localPixels[0].color}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-800">Owner</span>
          </div>
          <p className={`text-sm ${isOwned ? 'text-blue-600' : 'text-green-600'}`}>
            {isMultipleOwners ? 'Multiple owners' : localPixels[0].owner}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-800">Price</span>
          </div>
          <p className="text-lg font-bold text-green-600">
            {formatFlow(totalPrice)} FLOW
          </p>
        </div>

        <div className="mb-6 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-800">Color selection</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex items-center">
              <button
                type="button"
                className="w-8 h-8 rounded border-2 border-gray-300 focus:outline-none"
                style={{ backgroundColor: selectedColor }}
                onClick={() => setShowColorPicker(v => !v)}
                title="Pick custom color"
              />
              {showColorPicker && (
                <input
                  ref={colorInputRef}
                  type="color"
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  onBlur={() => setShowColorPicker(false)}
                  className="absolute left-0 top-0 z-50 w-8 h-8 border-none p-0 bg-transparent cursor-pointer"
                  autoFocus
                />
              )}
            </div>
            <input
              type="text"
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              className="font-mono text-sm border border-gray-300 rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={7}
              pattern="^#([A-Fa-f0-9]{6})$"
              title="Hex color, e.g. #aabbcc"
            />
          </div>

          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">

            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                  selectedColor === color
                    ? 'border-gray-800 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {!wallet.isConnected ? (
          <button
            onClick={wallet.connect}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
          >
            Connect wallet
          </button>
        ) : !wallet.networkCorrect ? (
          <button
            onClick={wallet.switchNetwork}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
          >
            Switch to Flow
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
          >
            <ShoppingCart size={18} />
            {loading ? 'Processing...' : `Buy for ${formatFlow(totalPrice)} FLOW`}
          </button>
        )}

        <p className="text-xs text-gray-500 mt-3 text-center">
          When purchasing, the pixel will be recolored to the selected color
        </p>
      </div>
    </div>
  );
};
