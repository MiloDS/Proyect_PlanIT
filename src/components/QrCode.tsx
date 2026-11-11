import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { QrCodeProps } from '../types/components';
import { colors } from '../styles/colors';
import { getQrDrawing } from '../utils/qr';

/** Código QR dibujado con SVG (negro sobre blanco, el contraste que leen todas las cámaras) */
export function QrCode({ value, size, accessibilityLabel }: QrCodeProps) {
  const drawing = useMemo(() => getQrDrawing(value), [value]);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${drawing.size} ${drawing.size}`}
      accessibilityLabel={accessibilityLabel}
    >
      <Rect width={drawing.size} height={drawing.size} fill={colors.white} />
      <Path d={drawing.path} fill={colors.black} />
    </Svg>
  );
}
