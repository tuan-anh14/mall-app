import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <View
      className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
