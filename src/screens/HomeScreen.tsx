import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@components/ui/Card';

interface Product {
  id: number;
  name: string;
  price: number;
}

const DEMO_PRODUCTS: Product[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.floor(Math.random() * 100) + 10,
}));

function ProductItem({ item, index }: { item: Product; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
      <Card className="mx-4 mb-3">
        <Text className="text-base font-semibold text-gray-800">
          {item.name}
        </Text>
        <Text className="text-sm text-primary-600 mt-1">${item.price}</Text>
      </Card>
    </Animated.View>
  );
}

export function HomeScreen() {
  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductItem item={item} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: Product) => String(item.id),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Mall</Text>
      </View>
      <FlashList
        data={DEMO_PRODUCTS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={80}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
