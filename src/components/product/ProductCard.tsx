import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { Product } from '@types/product';

// ─── Grid Card (2-column) ─────────────────────────────

interface ProductCardProps {
  product: Product;
  width: number;
  onPress?: () => void;
}

function ProductImage({
  uri,
  name,
  size,
}: {
  uri: string | null;
  name: string;
  size: number;
}) {
  const [error, setError] = useState(false);

  if (!uri || error) {
    return (
      <View style={[styles.imgPlaceholder, { height: size }]}>
        <Text style={styles.imgPlaceholderLetter}>{name[0]?.toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height: size }}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
}

export function ProductCard({ product, width, onPress }: ProductCardProps) {
  const imgSize = Math.round(width * 0.95);
  const badge = product.badge ?? (product.discount ? `−${product.discount}%` : null);

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* Image */}
      <View style={{ overflow: 'hidden', borderRadius: 12 }}>
        <ProductImage uri={product.image} name={product.name} size={imgSize} />
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {product.status === 'OUT_OF_STOCK' && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {product.ratingAverage > 0 && (
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingVal}>{product.ratingAverage.toFixed(1)}</Text>
            {product.reviewCount > 0 && (
              <Text style={styles.reviewCount}>({product.reviewCount})</Text>
            )}
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          {product.originalPrice != null && product.originalPrice > product.price && (
            <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Trending Card (horizontal) ───────────────────────

interface TrendingCardProps {
  product: Product;
  onPress?: () => void;
}

export function TrendingCard({ product, onPress }: TrendingCardProps) {
  const [imgError, setImgError] = useState(false);
  const showImg = product.image && !imgError;

  return (
    <TouchableOpacity
      style={styles.trendingCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.trendingImgWrapper}>
        {showImg ? (
          <Image
            source={{ uri: product.image! }}
            style={styles.trendingImg}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.trendingPlaceholder}>
            <Text style={styles.trendingPlaceholderLetter}>
              {product.name[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        {product.discount != null && product.discount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>−{product.discount}%</Text>
          </View>
        )}
      </View>

      <View style={styles.trendingInfo}>
        <Text style={styles.trendingName} numberOfLines={2}>
          {product.name}
        </Text>
        {product.ratingAverage > 0 && (
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingVal}>{product.ratingAverage.toFixed(1)}</Text>
          </View>
        )}
        <Text style={styles.trendingPrice}>${product.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  imgPlaceholder: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgPlaceholderLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A56DB',
    opacity: 0.35,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outOfStock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  star: {
    fontSize: 12,
    color: '#F59E0B',
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  reviewCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A56DB',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },

  // Trending card
  trendingCard: {
    width: 148,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  trendingImgWrapper: {
    width: 148,
    height: 148,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  trendingImg: {
    width: '100%',
    height: '100%',
  },
  trendingPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  trendingPlaceholderLetter: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1A56DB',
    opacity: 0.3,
  },
  trendingInfo: {
    padding: 10,
    gap: 4,
  },
  trendingName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
  },
  trendingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A56DB',
  },
});
