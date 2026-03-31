import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Colors } from '@constants/theme';

interface ScreenHeaderProps {
  title?: string;
  onBack: () => void;
  rightContent?: React.ReactNode;
  bordered?: boolean;
  style?: ViewStyle;
}

export function ScreenHeader({ title, onBack, rightContent, bordered = false, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.header, bordered && styles.bordered, style]}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {title ? (
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {rightContent ? (
        <View style={styles.right}>{rightContent}</View>
      ) : (
        title ? <View style={styles.spacer} /> : null
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  bordered: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backIcon: { fontSize: 18, color: Colors.text },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  spacer: { width: 36 },
  right: { flexShrink: 0 },
});
