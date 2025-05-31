import type { Pixel } from '../components/PixelArtApp';

const COLORS = [
  '#022b7a',
  '#710461',
  '#a02c5d',
  '#ec0e47',
  '#ee6c3b',
  '#fcbf54',
  '#abd96d',
  '#14c285',
  '#077353',
  '#055459',
  '#26294a',
  '#1a1334',
  '#f8f9fa' // gentle white shade
];

export function generateMockPixels(GRID_SIZE: number): Pixel[][] {
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
  for (let i = 0; i < 1200; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    const owners = ['User1', 'User2', 'User3', 'PixelArtist', 'CryptoFan'];

    initialPixels[x][y] = {
      ...initialPixels[x][y],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      owner: owners[Math.floor(Math.random() * owners.length)]
    };
  }

  return initialPixels;
}
