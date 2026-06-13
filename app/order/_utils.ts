import { Dimensions, PixelRatio } from 'react-native';

// ─── Responsive Scaling ───────────────────────────────────────────────────────


const BASE_WIDTH = 390;
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');const scale = SCREEN_WIDTH / BASE_WIDTH;
export const sp = (size: number) => {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};



export const dp = (size: number) => Math.round(size * scale);

export const clampSp = (size: number, min: number, max: number) =>
  Math.min(Math.max(sp(size), min), max);

export const clampDp = (size: number, min: number, max: number) =>
  Math.min(Math.max(dp(size), min), max);