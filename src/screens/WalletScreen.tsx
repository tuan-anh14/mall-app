import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Shadows } from '@constants/theme';
import { QUERY_KEYS } from '@constants/queryKeys';
import { walletService } from '@services/walletService';
import { formatVnd } from '@utils/index';
import { ScreenHeader } from '@components/ui/ScreenHeader';
import type { RootStackParamList } from '@app/navigation/types';
import type { WalletTransaction, WalletTransactionType } from '@typings/wallet';

// ─── Constants ────────────────────────────────────────

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TX_CONFIG: Record<WalletTransactionType, { label: string; icon: string; color: string; sign: '+' | '-' }> = {
  DEPOSIT:             { label: 'Nạp tiền',        icon: 'arrow-down-circle-outline', color: Colors.success, sign: '+' },
  WITHDRAW:            { label: 'Rút tiền',         icon: 'arrow-up-circle-outline',   color: Colors.danger,  sign: '-' },
  PAYMENT:             { label: 'Thanh toán đơn',  icon: 'cart-outline',              color: Colors.danger,  sign: '-' },
  REFUND:              { label: 'Hoàn tiền đơn',   icon: 'refresh-circle-outline',    color: Colors.success, sign: '+' },
  SELLER_INCOME:       { label: 'Doanh thu',       icon: 'trending-up-outline',       color: Colors.success, sign: '+' },
  SELLER_FEE_DEDUCTED: { label: 'Phí dịch vụ',     icon: 'remove-circle-outline',     color: Colors.danger,  sign: '-' },
  ADJUSTMENT:          { label: 'Điều chỉnh',       icon: 'options-outline',           color: Colors.textSub, sign: '+' },
};

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Transaction row ──────────────────────────────────

function TxRow({ tx }: { tx: WalletTransaction }) {
  const cfg   = TX_CONFIG[tx.type] ?? TX_CONFIG.ADJUSTMENT;
  const isPending = tx.status === 'PENDING';
  const isFailed  = tx.status === 'FAILED';
  const isDebit   = cfg.sign === '-';
  const amtColor  = isFailed ? Colors.textMuted : (isDebit ? Colors.danger : Colors.success);

  return (
    <View style={S.txRow}>
      <View style={[S.txIcon, { backgroundColor: isFailed ? Colors.bg : (isDebit ? Colors.dangerLight : Colors.successLight) }]}>
        <Ionicons
          name={cfg.icon as any}
          size={20}
          color={isFailed ? Colors.textMuted : (isDebit ? Colors.danger : Colors.success)}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={S.txLabel}>{cfg.label}</Text>
        {tx.description ? <Text style={S.txDesc} numberOfLines={1}>{tx.description}</Text> : null}
        <Text style={S.txDate}>{fmtDate(tx.createdAt)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[S.txAmount, { color: amtColor }]}>
          {isFailed ? '' : cfg.sign}{formatVnd(tx.amount)}
        </Text>
        {isPending && <Text style={S.txPending}>Đang xử lý</Text>}
        {isFailed  && <Text style={S.txFailed}>Thất bại</Text>}
      </View>
    </View>
  );
}

// ─── Deposit modal ────────────────────────────────────

interface DepositModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  loading: boolean;
}

function DepositModal({ visible, onClose, onSubmit, loading }: DepositModalProps) {
  const [amount, setAmount] = useState('');

  function handleSubmit() {
    const val = Number(amount.replace(/\D/g, ''));
    if (val < 10_000) {
      Alert.alert('Lỗi', 'Số tiền nạp tối thiểu là 10.000đ');
      return;
    }
    onSubmit(val);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={S.modalOverlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={S.modalSheet}>
          <View style={S.modalHandle} />
          <Text style={S.modalTitle}>Nạp tiền vào ví</Text>
          <Text style={S.modalSub}>Thanh toán qua VNPay</Text>

          <TextInput
            style={S.amountInput}
            placeholder="Nhập số tiền (VND)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Quick select */}
          <View style={S.quickRow}>
            {QUICK_AMOUNTS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[S.quickBtn, amount === String(a) && S.quickBtnActive]}
                onPress={() => setAmount(String(a))}
              >
                <Text style={[S.quickBtnText, amount === String(a) && S.quickBtnTextActive]}>
                  {a >= 1_000_000 ? `${a / 1_000_000}M` : `${a / 1_000}K`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[S.modalSubmitBtn, (!amount || loading) && S.btnDim]}
            onPress={handleSubmit}
            disabled={!amount || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.modalSubmitText}>Tiếp tục thanh toán</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Withdraw modal ───────────────────────────────────

interface WithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (dto: { amount: number; bankName: string; bankAccount: string; accountHolder: string }) => void;
  loading: boolean;
}

function WithdrawModal({ visible, onClose, onSubmit, loading }: WithdrawModalProps) {
  const [amount, setAmount]          = useState('');
  const [bankName, setBankName]      = useState('');
  const [account, setAccount]        = useState('');
  const [holder, setHolder]          = useState('');

  function handleSubmit() {
    const val = Number(amount.replace(/\D/g, ''));
    if (val < 50_000) { Alert.alert('Lỗi', 'Số tiền rút tối thiểu là 50.000đ'); return; }
    if (!bankName.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên ngân hàng'); return; }
    if (!account.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập số tài khoản'); return; }
    if (!holder.trim())  { Alert.alert('Lỗi', 'Vui lòng nhập tên chủ tài khoản'); return; }
    onSubmit({ amount: val, bankName, bankAccount: account, accountHolder: holder });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={S.modalOverlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={[S.modalSheet, { maxHeight: '85%' }]}>
          <View style={S.modalHandle} />
          <Text style={S.modalTitle}>Rút tiền</Text>
          <Text style={S.modalSub}>Tối thiểu 50.000đ</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { label: 'Số tiền (VND)', value: amount, set: setAmount, kb: 'number-pad' as const, placeholder: 'VD: 200000' },
              { label: 'Tên ngân hàng', value: bankName, set: setBankName, kb: 'default' as const, placeholder: 'VD: Vietcombank' },
              { label: 'Số tài khoản',  value: account, set: setAccount, kb: 'number-pad' as const, placeholder: 'VD: 1234567890' },
              { label: 'Tên chủ tài khoản', value: holder, set: setHolder, kb: 'default' as const, placeholder: 'VD: NGUYEN VAN A' },
            ].map((f) => (
              <View key={f.label} style={{ marginBottom: 12 }}>
                <Text style={S.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={S.fieldInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={f.kb}
                  value={f.value}
                  onChangeText={f.set}
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[S.modalSubmitBtn, loading && S.btnDim]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.modalSubmitText}>Gửi yêu cầu rút tiền</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────

export function WalletScreen() {
  const nav = useNavigation<Nav>();
  const qc  = useQueryClient();

  const [depositVisible,  setDepositVisible]  = useState(false);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [txPage, setTxPage] = useState(1);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: QUERY_KEYS.wallet,
    queryFn:  walletService.getWallet,
  });

  const { data: stats } = useQuery({
    queryKey: QUERY_KEYS.walletStats,
    queryFn:  walletService.getStats,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: QUERY_KEYS.walletTxns(txPage),
    queryFn:  () => walletService.getTransactions({ page: txPage, limit: 15 }),
  });

  const depositMutation = useMutation({
    mutationFn: (amount: number) =>
      walletService.createDeposit({ amount, gateway: 'VNPAY' }),
    onSuccess: (res) => {
      setDepositVisible(false);
      Alert.alert(
        'Chuyển đến thanh toán',
        'Bạn sẽ được chuyển đến trang thanh toán VNPay.',
        [{ text: 'OK' }],
      );
      // In a real app: open res.paymentUrl via Linking.openURL
    },
    onError: () => Alert.alert('Lỗi', 'Không thể tạo giao dịch nạp tiền'),
  });

  const withdrawMutation = useMutation({
    mutationFn: walletService.withdraw,
    onSuccess: () => {
      setWithdrawVisible(false);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.wallet });
      qc.invalidateQueries({ queryKey: ['wallet', 'txns'] });
      Alert.alert('Thành công', 'Yêu cầu rút tiền đã được ghi nhận và sẽ được xử lý trong 1–3 ngày làm việc');
    },
    onError: () => Alert.alert('Lỗi', 'Không thể thực hiện rút tiền lúc này'),
  });

  const transactions = txData?.transactions ?? [];

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <ScreenHeader title="Ví của tôi" onBack={() => nav.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollContent}>

        {/* ── Balance card ── */}
        <View style={S.balanceCard}>
          <Text style={S.balanceLabel}>Số dư khả dụng</Text>
          {walletLoading
            ? <ActivityIndicator color="#fff" style={{ marginVertical: 8 }} />
            : <Text style={S.balanceAmount}>{formatVnd(wallet?.balance ?? 0)}</Text>}
          <View style={S.actionRow}>
            <TouchableOpacity style={S.actionBtn} onPress={() => setDepositVisible(true)}>
              <View style={S.actionIcon}>
                <Ionicons name="add" size={22} color={Colors.primary} />
              </View>
              <Text style={S.actionLabel}>Nạp tiền</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.actionBtn} onPress={() => setWithdrawVisible(true)}>
              <View style={S.actionIcon}>
                <Ionicons name="arrow-up-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={S.actionLabel}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats ── */}
        {stats && (
          <View style={S.statsCard}>
            {[
              { label: 'Đã chi tiêu',   value: stats.totalSpent,     color: Colors.danger  },
              { label: 'Đã rút',        value: stats.totalWithdrawn,  color: Colors.textSub },
              { label: 'Hoàn tiền',     value: stats.totalRefunded,   color: Colors.success },
            ].map((s) => (
              <View key={s.label} style={S.statItem}>
                <Text style={[S.statValue, { color: s.color }]}>{formatVnd(s.value)}</Text>
                <Text style={S.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Transactions ── */}
        <View style={S.card}>
          <Text style={S.sectionTitle}>Lịch sử giao dịch</Text>

          {txLoading ? (
            <View style={S.txSkeleton}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB' }} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, width: '50%' }} />
                    <View style={{ height: 10, backgroundColor: '#E5E7EB', borderRadius: 6, width: '35%' }} />
                  </View>
                  <View style={{ height: 14, backgroundColor: '#E5E7EB', borderRadius: 6, width: 70 }} />
                </View>
              ))}
            </View>
          ) : transactions.length === 0 ? (
            <View style={S.txEmpty}>
              <Ionicons name="swap-horizontal-outline" size={40} color={Colors.textMuted} />
              <Text style={S.txEmptyText}>Chưa có giao dịch nào</Text>
            </View>
          ) : (
            <>
              {transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}

              {txData && txPage < txData.totalPages && (
                <TouchableOpacity
                  style={S.loadMoreBtn}
                  onPress={() => setTxPage((p) => p + 1)}
                >
                  <Text style={S.loadMoreText}>Xem thêm giao dịch</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

      </ScrollView>

      {/* Modals */}
      <DepositModal
        visible={depositVisible}
        onClose={() => setDepositVisible(false)}
        onSubmit={(amount) => depositMutation.mutate(amount)}
        loading={depositMutation.isPending}
      />
      <WithdrawModal
        visible={withdrawVisible}
        onClose={() => setWithdrawVisible(false)}
        onSubmit={(dto) => withdrawMutation.mutate(dto)}
        loading={withdrawMutation.isPending}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

const S = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: 12, gap: 10, paddingBottom: 40 },

  // Balance
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 4,
    ...Shadows.button,
  },
  balanceLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  balanceAmount: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  actionRow: { flexDirection: 'row', gap: 32, marginTop: 16 },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },

  // Stats
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16,
    flexDirection: 'row',
    ...Shadows.card,
  },
  statItem:  { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textSub, textAlign: 'center' },

  // Card
  card:         { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, ...Shadows.card },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 12 },

  // Transactions
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  txIcon:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txLabel:   { fontSize: 13, fontWeight: '600', color: Colors.text },
  txDesc:    { fontSize: 11, color: Colors.textSub, marginTop: 1 },
  txDate:    { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  txAmount:  { fontSize: 14, fontWeight: '800' },
  txPending: { fontSize: 10, color: '#D97706', fontWeight: '600', marginTop: 2 },
  txFailed:  { fontSize: 10, color: Colors.danger, fontWeight: '600', marginTop: 2 },
  txSkeleton: { gap: 4 },
  txEmpty:   { alignItems: 'center', paddingVertical: 32, gap: 10 },
  txEmptyText: { fontSize: 13, color: Colors.textMuted },
  loadMoreBtn: {
    alignItems: 'center', marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
  },
  loadMoreText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Modal
  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 4,
  },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  modalSub:     { fontSize: 13, color: Colors.textSub, textAlign: 'center', marginBottom: 4 },
  amountInput: {
    height: 52, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16,
    fontSize: 18, fontWeight: '700', color: Colors.text,
    backgroundColor: Colors.inputBg,
  },
  quickRow:      { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', backgroundColor: Colors.bg,
  },
  quickBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  quickBtnText:  { fontSize: 13, fontWeight: '700', color: Colors.textSub },
  quickBtnTextActive: { color: Colors.primary },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  fieldInput: {
    height: 46, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14,
    fontSize: 14, color: Colors.text, backgroundColor: Colors.inputBg,
  },
  modalSubmitBtn: {
    height: 50, backgroundColor: Colors.primary, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.button,
  },
  modalSubmitText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  btnDim: { opacity: 0.5 },
});
