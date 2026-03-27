import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Product } from '@types/product';

// ─── Shared helpers ───────────────────────────────────

function StarRow({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={shared.starRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < full ? 'star' : i === full && half ? 'star-half' : 'star-outline'}
          size={11}
          color="#F59E0B"
        />
      ))}
      {count > 0 && (
        <Text style={shared.reviewCount}>({count > 999 ? '999+' : count})</Text>
      )}
    </View>
  );
}

// ─── Grid Card (2-column) ─────────────────────────────

interface ProductCardProps {
  product: Product;
  width: number;
  onPress?: () => void;
}

export function ProductCard({ product, width, onPress }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [wished, setWished] = useState(false);
  const imgSize = Math.round(width);
  const badge = product.badge ?? (product.discount ? `−${product.discount}%` : null);
  const hasOriginal = product.originalPrice != null && product.originalPrice > product.price;

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      activeOpacity={0.92}
      onPress={onPress}
    >
      {/* Image */}
      <View style={[styles.imgWrapper, { height: imgSize }]}>
        {product.image && !imgError ? (
          <Image
            source={{ uri: product.image }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.imgPlaceholder}>
            <Ionicons name="image-outline" size={32} color="#CBD5E1" />
          </View>
        )}

        {/* Gradient overlay bottom */}
        {badge && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{badge}</Text>
          </View>
        )}

        {product.status === 'OUT_OF_STOCK' && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>Hết hàng</Text>
          </View>
        )}

        {/* Wishlist button */}
        <TouchableOpacity
          style={styles.wishBtn}
          onPress={() => setWished((v) => !v)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={wished ? 'heart' : 'heart-outline'}
            size={18}
            color={wished ? '#EF4444' : '#94A3B8'}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        {product.category ? (
          <Text style={styles.category} numberOfLines={1}>{product.category}</Text>
        ) : null}

        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

        {product.ratingAverage > 0 && (
          <StarRow rating={product.ratingAverage} count={product.reviewCount} />
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          {hasOriginal && (
            <Text style={styles.originalPrice}>${product.originalPrice!.toFixed(2)}</Text>
          )}
        </View>

        {product.seller?.storeName ? (
          <View style={styles.sellerRow}>
            {product.seller.isVerified && (
              <Ionicons name="checkmark-circle" size={11} color="#1A56DB" />
            )}
            <Text style={styles.sellerName} numberOfLines={1}>
              {product.seller.storeName}
            </Text>
          </View>
        ) : null}
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
  const [wished, setWished] = useState(false);

  return (
    <TouchableOpacity style={tStyles.card} activeOpacity={0.92} onPress={onPress}>
      {/* Image */}
      <View style={tStyles.imgWrapper}>
        {product.image && !imgError ? (
          <Image
            source={{ uri: product.image }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={tStyles.placeholder}>
            <Ionicons name="image-outline" size={28} color="#CBD5E1" />
          </View>
        )}
        {product.discount != null && product.discount > 0 && (
          <View style={tStyles.badge}>
            <Text style={tStyles.badgeText}>−{product.discount}%</Text>
          </View>
        )}
        <TouchableOpacity
          style={tStyles.wishBtn}
          onPress={() => setWished((v) => !v)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={wished ? 'heart' : 'heart-outline'}
            size={16}
            color={wished ? '#EF4444' : '#94A3B8'}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={tStyles.info}>
        <Text style={tStyles.name} numberOfLines={2}>{product.name}</Text>
        {product.ratingAverage > 0 && (
          <StarRow rating={product.ratingAverage} count={0} />
        )}
        <View style={tStyles.priceRow}>
          <Text style={tStyles.price}>${product.price.toFixed(2)}</Text>
          {product.originalPrice != null && product.originalPrice > product.price && (
            <Text style={tStyles.original}>${product.originalPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────

const shared = StyleSheet.create({
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewCount: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 2,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imgWrapper: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  outOfStock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  wishBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  info: {
    padding: 12,
    gap: 4,
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A56DB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A56DB',
  },
  originalPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  sellerName: {
    fontSize: 10,
    color: '#9CA3AF',
    flex: 1,
  },
});

const tStyles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imgWrapper: {
    width: 160,
    height: 160,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  wishBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A56DB',
  },
  original: {
    fontSize: 11,
    color: '#CBD5E1',
    textDecorationLine: 'line-through',
  },
});
