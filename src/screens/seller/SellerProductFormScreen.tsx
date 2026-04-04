import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { sellerProductService } from '@services/sellerProductService';
import { productService } from '@services/productService';
import type { SellerStackParamList } from '@app/navigation/types';
import type { CreateProductDto } from '@typings/seller';

type Nav = NativeStackNavigationProp<SellerStackParamList>;
type Route = RouteProp<SellerStackParamList, 'SellerProductForm'>;

function ChipInput({
  label,
  values,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');
  return (
    <View style={CI.wrapper}>
      <Text style={CI.label}>{label}</Text>
      <View style={CI.chips}>
        {values.map((v) => (
          <View key={v} style={CI.chip}>
            <Text style={CI.chipText}>{v}</Text>
            <TouchableOpacity onPress={() => onRemove(v)} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <Ionicons name="close" size={12} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={CI.inputRow}>
        <TextInput
          style={CI.input}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={() => {
            const v = input.trim();
            if (v && !values.includes(v)) {
              onAdd(v);
              setInput('');
            }
          }}
        />
        <TouchableOpacity
          style={CI.addBtn}
          onPress={() => {
            const v = input.trim();
            if (v && !values.includes(v)) {
              onAdd(v);
              setInput('');
            }
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function SellerProductFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const { productId } = route.params;
  const isEdit = !!productId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [discount, setDiscount] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: productService.getCategories,
  });

  const { data: existingProducts = [] } = useQuery({
    queryKey: QUERY_KEYS.sellerProducts(),
    queryFn: () => sellerProductService.getProducts(),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && existingProducts.length > 0) {
      const p = existingProducts.find((pr) => pr.id === productId);
      if (p) {
        setName(p.name);
        setDescription(p.description);
        setPrice(p.price.toString());
        setStock(p.stock.toString());
        setDiscount(p.discount != null ? p.discount.toString() : '');
        setBrand(p.brand ?? '');
        setCategoryId(p.categoryId ?? '');
        setColors(p.colors);
        setSizes(p.sizes);
        setImages(p.images);
      }
    }
  }, [isEdit, productId, existingProducts]);

  const createMutation = useMutation({
    mutationFn: (dto: CreateProductDto) => sellerProductService.createProduct(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sellerProducts() });
      Alert.alert('Thành công', 'Sản phẩm đã được tạo!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => Alert.alert('Lỗi', 'Không thể tạo sản phẩm. Vui lòng thử lại.'),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: CreateProductDto) =>
      sellerProductService.updateProduct(productId!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sellerProducts() });
      Alert.alert('Thành công', 'Sản phẩm đã được cập nhật!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => Alert.alert('Lỗi', 'Không thể cập nhật sản phẩm.'),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function validate(): string | null {
    if (!name.trim()) return 'Tên sản phẩm không được để trống';
    if (!description.trim()) return 'Mô tả không được để trống';
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
      return 'Giá phải là số dương';
    if (!stock.trim() || isNaN(Number(stock)) || Number(stock) < 0)
      return 'Tồn kho phải >= 0';
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      Alert.alert('Thiếu thông tin', err);
      return;
    }
    const dto: CreateProductDto = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      stock: Number(stock),
      discount: discount ? Number(discount) : undefined,
      brand: brand.trim() || undefined,
      categoryId: categoryId || undefined,
      colors,
      sizes,
      images,
    };
    if (isEdit) {
      updateMutation.mutate(dto);
    } else {
      createMutation.mutate(dto);
    }
  }

  function addImage() {
    const url = imageInput.trim();
    if (url && !images.includes(url)) {
      setImages((prev) => [...prev, url]);
      setImageInput('');
    }
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>
          {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
        </Text>
        <TouchableOpacity
          style={[S.saveBtn, isPending && S.saveBtnDim]}
          onPress={handleSave}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={S.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Thông tin cơ bản</Text>

          <Field label="Tên sản phẩm *" required>
            <TextInput
              style={S.input}
              value={name}
              onChangeText={setName}
              placeholder="Nhập tên sản phẩm"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>

          <Field label="Mô tả *">
            <TextInput
              style={[S.input, S.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả chi tiết về sản phẩm"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>

          <Field label="Thương hiệu">
            <TextInput
              style={S.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="Tên thương hiệu"
              placeholderTextColor={Colors.textMuted}
            />
          </Field>
        </View>

        {/* Pricing */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Giá & Tồn kho</Text>

          <View style={S.row2}>
            <View style={S.flex1}>
              <Field label="Giá (VND) *">
                <TextInput
                  style={S.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </Field>
            </View>
            <View style={S.flex1}>
              <Field label="Tồn kho *">
                <TextInput
                  style={S.input}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </Field>
            </View>
          </View>

          <Field label="Giảm giá (%)">
            <TextInput
              style={S.input}
              value={discount}
              onChangeText={setDiscount}
              placeholder="0 - 100"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </Field>
        </View>

        {/* Category */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Danh mục</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.catRow}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  S.catChip,
                  categoryId === cat.id && S.catChipSelected,
                ]}
                onPress={() =>
                  setCategoryId(categoryId === cat.id ? '' : cat.id)
                }
              >
                <Text
                  style={[
                    S.catChipText,
                    categoryId === cat.id && S.catChipTextSelected,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Variants */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Variants</Text>
          <ChipInput
            label="Màu sắc"
            values={colors}
            onAdd={(v) => setColors((c) => [...c, v])}
            onRemove={(v) => setColors((c) => c.filter((x) => x !== v))}
            placeholder="Thêm màu (vd: Đỏ)"
          />
          <ChipInput
            label="Kích thước"
            values={sizes}
            onAdd={(v) => setSizes((s) => [...s, v])}
            onRemove={(v) => setSizes((s) => s.filter((x) => x !== v))}
            placeholder="Thêm size (vd: M, L, XL)"
          />
        </View>

        {/* Images */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Hình ảnh</Text>

          {images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.imgRow}
            >
              {images.map((url, idx) => (
                <View key={idx} style={S.imgThumbWrap}>
                  <Image
                    source={{ uri: url }}
                    style={S.imgThumb}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={S.imgRemove}
                    onPress={() =>
                      setImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={S.imgInputRow}>
            <TextInput
              style={[S.input, S.imgInput]}
              value={imageInput}
              onChangeText={setImageInput}
              placeholder="Dán URL hình ảnh..."
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={addImage}
            />
            <TouchableOpacity style={S.imgAddBtn} onPress={addImage}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={FD.wrapper}>
      <Text style={FD.label}>{label}</Text>
      {children}
    </View>
  );
}

const FD = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
});

const CI = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Colors.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    ...Shadows.button,
  },
  saveBtnDim: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    height: 44,
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  row2: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  catRow: { gap: 8, paddingBottom: 4 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  catChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  catChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSub },
  catChipTextSelected: { color: Colors.primary, fontWeight: '700' },
  imgRow: { gap: 10, paddingBottom: 4 },
  imgThumbWrap: { position: 'relative' },
  imgThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.bg,
  },
  imgRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  imgInputRow: { flexDirection: 'row', gap: 8 },
  imgInput: { flex: 1 },
  imgAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
