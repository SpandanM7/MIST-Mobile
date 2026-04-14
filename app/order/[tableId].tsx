import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/theme';
import {
  fetchMenuCategories,
  fetchMenuItems,
  fetchOrderByTable,
  submitOrder,
  updateOrder,
  MenuCategory,
  MenuItem,
  OrderItem,
} from '@/services/restaurant';

// ─── Types ────────────────────────────────────────────────────────────────────

type CartEntry = {
  slotId: string;
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  note: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);
const calcTotal = (cart: CartEntry[]) => cart.reduce((sum, e) => sum + e.price * e.quantity, 0);
const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tableId: string; tableNumber: string; status: string }>();
  const { tableId, tableNumber, status } = params;
  const isEdit = status === 'order_taken';

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);

  const [showCart, setShowCart] = useState(false);
  const [noteModal, setNoteModal] = useState<{ visible: boolean; slotId: string; note: string }>({
    visible: false, slotId: '', note: '',
  });
  const [exitConfirm, setExitConfirm] = useState(false);

  // ─── Load data ───────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    try {
      const [cats, items] = await Promise.all([fetchMenuCategories(), fetchMenuItems()]);
      setCategories(cats);
      setMenuItems(items);
      if (cats.length) setActiveCategory(cats[0].id);

      if (isEdit) {
        const existing = await fetchOrderByTable(tableId);
        if (existing) {
          setExistingOrderId(existing.id);
          setSpecialInstructions(existing.specialInstructions);
          setCart(existing.items.map(item => ({
            slotId: uid(),
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            price: item.price,
            quantity: item.quantity,
            note: item.note,
          })));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [tableId, isEdit]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showCart) { setShowCart(false); return true; }
      if (cart.length > 0) { setExitConfirm(true); return true; }
      return false;
    });
    return () => sub.remove();
  }, [cart.length, showCart]);

  // ─── Cart operations ──────────────────────────────────────────────────────────

  const addToCart = (item: MenuItem) => {
    setCart(prev => [...prev, {
      slotId: uid(),
      menuItemId: item.id,
      menuItemName: item.name,
      price: item.price,
      quantity: 1,
      note: '',
    }]);
  };

  const removeSlot = (slotId: string) => setCart(prev => prev.filter(e => e.slotId !== slotId));

  const changeQty = (slotId: string, delta: number) => {
    setCart(prev => prev.map(e => {
      if (e.slotId !== slotId) return e;
      const q = e.quantity + delta;
      if (q < 1) return e;
      return { ...e, quantity: q };
    }));
  };

  const saveNote = () => {
    setCart(prev => prev.map(e =>
      e.slotId === noteModal.slotId ? { ...e, note: noteModal.note } : e
    ));
    setNoteModal({ visible: false, slotId: '', note: '' });
  };

  const cartCountForItem = (itemId: string) =>
    cart.filter(e => e.menuItemId === itemId).reduce((s, e) => s + e.quantity, 0);

  // ─── Submit ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Order', 'Please add at least one item to the order.');
      return;
    }
    setSaving(true);
    try {
      const items = cart.map(e => ({
        menuItemId: e.menuItemId,
        menuItemName: e.menuItemName,
        price: e.price,
        quantity: e.quantity,
        note: e.note,
      }));

      if (isEdit && existingOrderId) {
        await updateOrder(existingOrderId, items, specialInstructions);
      } else {
        await submitOrder(tableId, items, specialInstructions, 'w1', 'Demo Waiter');
      }

      Alert.alert(
        isEdit ? 'Order Updated!' : 'Order Placed!',
        `Table ${tableNumber} order has been ${isEdit ? 'updated' : 'submitted'} successfully.`,
        [{ text: 'OK', onPress: () => router.replace('/tables' as any) }]
      );
    } catch {
      Alert.alert('Error', 'Failed to save the order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (cart.length > 0) setExitConfirm(true);
    else router.back();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  const filteredItems = menuItems.filter(i => i.categoryId === activeCategory);
  const total = calcTotal(cart);

  // Bottom bar height so FlatList doesn't scroll behind it
  const bottomBarHeight = 72 + insets.bottom;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{isEdit ? 'Loading order...' : 'Loading menu...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Table {tableNumber}</Text>
          <Text style={styles.headerSub}>{isEdit ? 'Edit Order' : 'New Order'}</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(true)}>
          <Text style={styles.cartIcon}>🧾</Text>
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.reduce((s, e) => s + e.quantity, 0)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Category Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catBtn, activeCategory === cat.id && styles.catBtnActive]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Menu Items ── */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        // Pad bottom so last item isn't hidden behind the bottom bar
        contentContainerStyle={[styles.menuList, { paddingBottom: bottomBarHeight + 16 }]}
        renderItem={({ item }) => {
          const count = cartCountForItem(item.id);
          return (
            <View style={[styles.menuCard, !item.isAvailable && styles.menuCardDisabled]}>
              <View style={styles.menuCardLeft}>
                <View style={styles.menuCardTop}>
                  <View style={[styles.vegBadge, { backgroundColor: item.isVeg ? '#1a2a1a' : '#2a1a1a' }]}>
                    <View style={[styles.vegDot, { backgroundColor: item.isVeg ? Colors.primary : '#d9504a' }]} />
                  </View>
                  {item.tags.map(tag => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
              </View>
              <View style={styles.menuCardRight}>
                {!item.isAvailable ? (
                  <View style={styles.unavailableChip}>
                    <Text style={styles.unavailableText}>N/A</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.addBtn, count > 0 && styles.addBtnActive]}
                    onPress={() => addToCart(item)}
                  >
                    {count > 0 ? (
                      <Text style={styles.addBtnTextActive}>+{count} Add</Text>
                    ) : (
                      <Text style={styles.addBtnText}>+ Add</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ── Bottom Bar — sits above Android nav bar ── */}
      {cart.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.bottomBarLeft}>
            <Text style={styles.bottomBarCount}>{cart.reduce((s, e) => s + e.quantity, 0)} items</Text>
            <Text style={styles.bottomBarTotal}>{formatPrice(total)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>{isEdit ? 'Update Order' : 'Place Order'} →</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Cart Modal ── */}
      <Modal visible={showCart} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.cartModal, { paddingBottom: insets.bottom }]}>
            <View style={styles.cartModalHandle} />
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartModalTitle}>Order Summary</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Text style={styles.cartModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.cartScroll} showsVerticalScrollIndicator={false}>
              {cart.length === 0 ? (
                <Text style={styles.cartEmptyText}>No items added yet.</Text>
              ) : (
                cart.map(entry => (
                  <View key={entry.slotId} style={styles.cartEntry}>
                    <View style={styles.cartEntryTop}>
                      <Text style={styles.cartEntryName}>{entry.menuItemName}</Text>
                      <Text style={styles.cartEntryPrice}>
                        {formatPrice(entry.price * entry.quantity)}
                      </Text>
                    </View>
                    <View style={styles.cartEntryActions}>
                      <View style={styles.qtyRow}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(entry.slotId, -1)}>
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{entry.quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(entry.slotId, 1)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.noteBtn}
                        onPress={() => setNoteModal({ visible: true, slotId: entry.slotId, note: entry.note })}
                      >
                        <Text style={styles.noteBtnText}>
                          {entry.note ? '📝 ' + entry.note.slice(0, 18) + (entry.note.length > 18 ? '…' : '') : '+ Note'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.removeBtn} onPress={() => removeSlot(entry.slotId)}>
                        <Text style={styles.removeBtnText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              <View style={styles.specialBox}>
                <Text style={styles.specialLabel}>Special Instructions</Text>
                <TextInput
                  style={styles.specialInput}
                  placeholder="Any instructions for the kitchen..."
                  placeholderTextColor={Colors.textMuted}
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {cart.length > 0 && (
                <View style={styles.cartTotal}>
                  <Text style={styles.cartTotalLabel}>Total</Text>
                  <Text style={styles.cartTotalValue}>{formatPrice(total)}</Text>
                </View>
              )}
            </ScrollView>

            {cart.length > 0 && (
              <TouchableOpacity
                style={[styles.saveBtn, styles.cartSaveBtn, saving && styles.saveBtnDisabled]}
                onPress={() => { setShowCart(false); handleSave(); }}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{isEdit ? 'Update Order' : 'Place Order'} →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Note Modal ── */}
      <Modal visible={noteModal.visible} animationType="fade" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={styles.noteOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.noteModal}>
            <Text style={styles.noteModalTitle}>Item Note</Text>
            <Text style={styles.noteModalSub}>E.g. "medium rare", "less spicy", "no onions"</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Write a note for this item..."
              placeholderTextColor={Colors.textMuted}
              value={noteModal.note}
              onChangeText={t => setNoteModal(prev => ({ ...prev, note: t }))}
              autoFocus
              multiline
              numberOfLines={3}
            />
            <View style={styles.noteModalBtns}>
              <TouchableOpacity
                style={styles.noteCancelBtn}
                onPress={() => setNoteModal({ visible: false, slotId: '', note: '' })}
              >
                <Text style={styles.noteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.noteSaveBtn} onPress={saveNote}>
                <Text style={styles.noteSaveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Exit Confirmation ── */}
      <Modal visible={exitConfirm} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Discard Order?</Text>
            <Text style={styles.confirmBody}>
              You have unsaved changes. If you go back, your progress will be lost.
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setExitConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDiscard}
                onPress={() => { setExitConfirm(false); router.back(); }}
              >
                <Text style={styles.confirmDiscardText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  // Header — paddingTop handled dynamically via insets
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated },
  backIcon: { fontSize: 18, color: Colors.textPrimary },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 11, color: Colors.primary, fontWeight: '600', letterSpacing: 0.5 },
  cartBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartIcon: { fontSize: 22 },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: Colors.primary, borderRadius: Radius.full, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white },

  // Category tabs
  catRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, flexDirection: 'row' },
  catBtn: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.lg, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 3 },
  catBtnActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  catIcon: { fontSize: 18 },
  catLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  catLabelActive: { color: Colors.primary },

  // Menu
  menuList: { padding: Spacing.md, gap: 10 },
  menuCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center' },
  menuCardDisabled: { opacity: 0.4 },
  menuCardLeft: { flex: 1 },
  menuCardRight: { marginLeft: Spacing.sm },
  menuCardTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  vegBadge: { width: 16, height: 16, borderRadius: 3, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  tagChip: { backgroundColor: Colors.primaryGlow, paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.full },
  tagText: { fontSize: 9, color: Colors.primary, fontWeight: '700' },
  menuItemName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  menuItemDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15, marginBottom: 5 },
  menuItemPrice: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  addBtn: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: Colors.surfaceBorder },
  addBtnActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  addBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  addBtnTextActive: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  unavailableChip: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  unavailableText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  bottomBarLeft: { flex: 1 },
  bottomBarCount: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  bottomBarTotal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 20, paddingVertical: 14, minWidth: 160, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  cartSaveBtn: { marginHorizontal: Spacing.md, marginVertical: Spacing.md },

  // Cart modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  cartModal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', borderTopWidth: 1, borderColor: Colors.surfaceBorder },
  cartModalHandle: { width: 36, height: 4, backgroundColor: Colors.surfaceBorder, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  cartModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  cartModalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  cartModalClose: { fontSize: 16, color: Colors.textSecondary, padding: 4 },
  cartScroll: { maxHeight: 420 },
  cartEmptyText: { textAlign: 'center', color: Colors.textMuted, padding: Spacing.xl },
  cartEntry: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  cartEntryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cartEntryName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  cartEntryPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  cartEntryActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: 4 },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceBorder, borderRadius: 6 },
  qtyBtnText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '700' },
  qtyValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, minWidth: 20, textAlign: 'center' },
  noteBtn: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 6 },
  noteBtnText: { fontSize: 11, color: Colors.textSecondary },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 16 },
  specialBox: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  specialLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  specialInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm, fontSize: 13, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.surfaceBorder, minHeight: 70, textAlignVertical: 'top' },
  cartTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  cartTotalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  cartTotalValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },

  // Note modal
  noteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: Spacing.lg },
  noteModal: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.surfaceBorder },
  noteModalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  noteModalSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md },
  noteInput: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, fontSize: 14, color: Colors.textPrimary, borderWidth: 1.5, borderColor: Colors.surfaceBorder, minHeight: 80, textAlignVertical: 'top' },
  noteModalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  noteCancelBtn: { flex: 1, padding: 14, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, alignItems: 'center' },
  noteCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  noteSaveBtn: { flex: 1, padding: 14, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  noteSaveText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  // Exit confirm
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: Spacing.xl },
  confirmModal: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.surfaceBorder },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  confirmBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: Spacing.lg },
  confirmBtns: { flexDirection: 'row', gap: Spacing.sm },
  confirmCancel: { flex: 1, padding: 14, borderRadius: Radius.md, backgroundColor: Colors.primaryGlow, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center' },
  confirmCancelText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  confirmDiscard: { flex: 1, padding: 14, borderRadius: Radius.md, backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: Colors.error, alignItems: 'center' },
  confirmDiscardText: { fontSize: 14, fontWeight: '700', color: Colors.error },
});