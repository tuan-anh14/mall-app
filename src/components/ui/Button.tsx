import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'outline';
}

export function Button({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      className={[
        'h-12 rounded-xl items-center justify-center px-6',
        variant === 'primary'
          ? 'bg-primary-600'
          : 'border border-primary-600 bg-transparent',
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : '#2563eb'}
        />
      ) : (
        <Text
          className={`text-base font-semibold ${
            variant === 'primary' ? 'text-white' : 'text-primary-600'
          }`}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
