import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/theme';

type IonName = React.ComponentProps<typeof Ionicons>['name'];

interface PlaceholderScreenProps {
  icon: IonName;
  title: string;
}

export function PlaceholderScreen({ icon, title }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Ionicons name={icon} size={64} color={Colors.border} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>Tính năng đang phát triển</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.inputBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textMuted },
});
