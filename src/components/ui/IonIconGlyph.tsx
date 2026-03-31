import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IonGlyphName = NonNullable<React.ComponentProps<typeof Ionicons>['name']>;

type Props = {
  name: IonGlyphName;
  size?: number;
  color?: string;
};

/** Ionicons cố định kích thước — dùng trong Input / menu, tránh emoji không render trên một số máy. */
export function IonIconGlyph({
  name,
  size = 18,
  color = '#6B7280',
}: Props) {
  return <Ionicons name={name} size={size} color={color} />;
}
