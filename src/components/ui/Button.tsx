import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '@constants/theme';

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
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[styles.base, isPrimary ? styles.primary : styles.outline, isDisabled && styles.disabled, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFF' : Colors.primary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelOutline]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  labelPrimary: {
    color: '#FFF',
  },
  labelOutline: {
    color: Colors.primary,
  },
});
