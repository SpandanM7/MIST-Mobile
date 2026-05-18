import { Colors, Radius } from '@/constants/theme';
import {
  fetchMenuCategories,
  fetchMenuItems,
  fetchOrderByTable,
  MenuCategory,
  MenuItem,
  OrderItem,
  submitOrder,
  updateOrder,
} from '@/services/restaurant';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert, { AlertButton } from '@/components/Customalert';

// ─── Responsive Scaling ───────────────────────────────────────────────────────
// Scales font sizes and dimensions relative to a 390px wide baseline (iPhone 14)
// Works correctly regardless of Android font scale setting in Accessibility

const BASE_WIDTH = 390;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const scale = SCREEN_WIDTH / BASE_WIDTH;

// sp() = scale-independent pixels — ignores user font scale (prevents layout breaks)
// Use for all fontSize values so they scale with screen width, not system font size
const sp = (size: number) => {
  const newSize = size * scale;
  // PixelRatio.roundToNearestPixel gives crisp rendering on all densities
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// dp() = layout dimension scaling — for width/height/padding/margin/radius
const dp = (size: number) => Math.round(size * scale);

// Clamp helpers — prevents values going too small on tiny screens or too large on tablets
const clampSp = (size: number, min: number, max: number) =>
  Math.min(Math.max(sp(size), min), max);
const clampDp = (size: number, min: number, max: number) =>
  Math.min(Math.max(dp(size), min), max);


const [alert, setAlert] = useState<{
  visible: boolean;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  emoji?: string;
  buttons?: AlertButton[];
}>({ visible: false, title: '' });

const showAlert = (
  title: string,
  message?: string,
  type: 'info' | 'success' | 'error' | 'warning' = 'info',
  buttons?: AlertButton[],
  emoji?: string,
) => setAlert({ visible: true, title, message, type, buttons, emoji });

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
const calcTotal = (cart: CartEntry[]) =>
  cart.reduce((sum, e) => sum + e.price * e.quantity, 0);
const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    tableId: string;
    tableNumber: string;
    status: string;
  }>();
  const { tableId, tableNumber, status } = params;

  // FIX #5 — delivered tables are locked, not treated as new orders
  const isDelivered = status === 'delivered';
  const isEdit = status === 'order_taken';
  // Use a ref for existingOrderId to avoid race condition (FIX #3)
  const existingOrderIdRef = useRef<string | null>(null);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [originalCartLength, setOriginalCartLength] = useState(0); // FIX #4
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCart, setShowCart] = useState(false);
  const [noteModal, setNoteModal] = useState<{
    visible: boolean;
    slotId: string;
    note: string;
    itemName: string; // FIX #12 — track item name for modal title
  }>({ visible: false, slotId: '', note: '', itemName: '' });
  const [exitConfirm, setExitConfirm] = useState(false);

  // ─── Load data ─────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    try {
      const [cats, items] = await Promise.all([
        fetchMenuCategories(),
        fetchMenuItems(),
      ]);
      setCategories(cats);
      setMenuItems(items);
      if (cats.length) setActiveCategory(cats[0].id);

      if (isEdit) {
        const existing = await fetchOrderByTable(tableId);
        if (existing) {
          // FIX #3 — store in ref, not state, so handleSave always reads latest value
          existingOrderIdRef.current = existing.id;
          setSpecialInstructions(existing.specialInstructions);
          const loadedCart = existing.items.map(item => ({
            slotId: uid(),
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            price: item.price,
            quantity: item.quantity,
            note: item.note,
          }));
          setCart(loadedCart);
          // FIX #4 — remember original cart size to detect clearing in edit mode
          setOriginalCartLength(loadedCart.length);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [tableId, isEdit]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ─── Hardware back guard ───────────────────────────────────────────────────

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showCart) {
        setShowCart(false);
        return true;
      }
      // FIX #4 — in edit mode, even empty cart = unsaved changes if we started with items
      const hasChanges =
        cart.length > 0 || (isEdit && originalCartLength > 0 && cart.length === 0);
      if (hasChanges) {
        setExitConfirm(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [cart.length, showCart, isEdit, originalCartLength]);

  // ─── Cart operations ───────────────────────────────────────────────────────

  const addToCart = (item: MenuItem) => {
    setCart(prev => [
      ...prev,
      {
        slotId: uid(),
        menuItemId: item.id,
        menuItemName: item.name,
        price: item.price,
        quantity: 1,
        note: '',
      },
    ]);
  };

  // FIX #6 — remove the LAST slot for this item (menu card − button)
  const removeLastSlotForItem = (itemId: string) => {
    setCart(prev => {
      const lastIdx = [...prev].map(e => e.menuItemId).lastIndexOf(itemId);
      if (lastIdx === -1) return prev;
      return prev.filter((_, i) => i !== lastIdx);
    });
  };

  const removeSlot = (slotId: string) =>
    setCart(prev => prev.filter(e => e.slotId !== slotId));

  // FIX #1 & #8 — decrement removes slot when qty would go below 1
  const changeQty = (slotId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(e => {
          if (e.slotId !== slotId) return e;
          const q = e.quantity + delta;
          if (q < 1) return null; // mark for removal
          return { ...e, quantity: q };
        })
        .filter(Boolean) as CartEntry[];
    });
  };

  const saveNote = () => {
    setCart(prev =>
      prev.map(e =>
        e.slotId === noteModal.slotId ? { ...e, note: noteModal.note } : e
      )
    );
    setNoteModal({ visible: false, slotId: '', note: '', itemName: '' });
  };

  // Total quantity across all slots for a given menu item
  const cartCountForItem = (itemId: string) =>
    cart
      .filter(e => e.menuItemId === itemId)
      .reduce((s, e) => s + e.quantity, 0);

  // Unique item count (distinct menuItemIds) for cart badge
  // FIX #9 — badge shows distinct items, not total quantity
  const uniqueItemCount = new Set(cart.map(e => e.menuItemId)).size;

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (cart.length === 0) {
      showAlert('Empty Order', 'Please add at least one item to the order.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const items: OrderItem[] = cart.map(e => ({
        menuItemId: e.menuItemId,
        menuItemName: e.menuItemName,
        price: e.price,
        quantity: e.quantity,
        note: e.note,
      }));

      // FIX #3 — read from ref, not state, guaranteed to be latest value
      if (isEdit && existingOrderIdRef.current) {
        await updateOrder(existingOrderIdRef.current, items, specialInstructions);
      } else {
        await submitOrder(
          tableId,
          items,
          specialInstructions,
          'w1',
          'Demo Waiter'
        );
      }

      showAlert(
        isEdit ? 'Order Updated!' : 'Order Placed!',
        `Table ${tableNumber} order has been ${isEdit ? 'updated' : 'submitted'} successfully.`,
        'success',
        [{ text: 'OK', onPress: () => router.replace('/tables' as any) }]
    );
    } catch {
      showAlert('Error', 'Failed to save the order. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // FIX #13 — context-aware back guard text
  const handleBack = () => {
    const hasChanges =
      cart.length > 0 || (isEdit && originalCartLength > 0 && cart.length === 0);
    if (hasChanges) setExitConfirm(true);
    else router.back();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const filteredItems = menuItems.filter(i => i.categoryId === activeCategory);
  const total = calcTotal(cart);
  const bottomBarHeight = clampDp(72, 64, 88) + insets.bottom;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {isEdit ? 'Loading order...' : 'Loading menu...'}
        </Text>
      </View>
    );
  }

  // FIX #16 — delivered tables get a locked screen
  if (isDelivered) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + clampDp(12, 10, 20) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Table {tableNumber}</Text>
            <Text style={[styles.headerSub, { color: Colors.statusDeliveredText }]}>
              Delivered
            </Text>
          </View>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedEmoji}>✅</Text>
          <Text style={styles.lockedTitle}>Order Delivered</Text>
          <Text style={styles.lockedBody}>
            This table's order has been delivered.{'\n'}No changes can be made.
          </Text>
          <TouchableOpacity
            style={styles.lockedBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.lockedBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      {/* FIX #15 — edit mode gets a distinct amber accent */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + clampDp(12, 10, 20) },
          isEdit && styles.headerEdit,
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Table {tableNumber}</Text>
          <Text style={[styles.headerSub, isEdit && styles.headerSubEdit]}>
            {isEdit ? '✏️ Editing Order' : '🆕 New Order'}
          </Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(true)}>
          <Text style={styles.cartIcon}>🧾</Text>
          {/* FIX #9 — badge shows unique item count */}
          {uniqueItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{uniqueItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* FIX #15 — edit mode warning banner */}
      {isEdit && (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>
            ⚠️  Modifying existing live order — changes go straight to kitchen
          </Text>
        </View>
      )}

      {/* ── Category Tabs ── */}
      <View style={styles.catRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
          alwaysBounceHorizontal={false}
          style={{ flexShrink: 0 }} 
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catBtn, activeCategory === cat.id && styles.catBtnActive]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.catLabel,
                  activeCategory === cat.id && styles.catLabelActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Menu Items ── */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.menuList,
          { paddingBottom: cart.length > 0 ? bottomBarHeight + clampDp(16, 12, 24) : clampDp(24, 16, 32) },
        ]}
        // FIX #10 — empty state when category has no available items
        ListEmptyComponent={
          <View style={styles.emptyCategory}>
            <Text style={styles.emptyCategoryEmoji}>🍽️</Text>
            <Text style={styles.emptyCategoryText}>No items in this category</Text>
          </View>
        }
        renderItem={({ item }) => {
          const count = cartCountForItem(item.id);
          return (
            <View
              style={[
                styles.menuCard,
                !item.isAvailable && styles.menuCardDisabled,
              ]}
            >
              <View style={styles.menuCardLeft}>
                <View style={styles.menuCardTop}>
                  {/* Veg/Non-veg indicator */}
                  <View
                    style={[
                      styles.vegBadge,
                      { backgroundColor: item.isVeg ? '#1a2a1a' : '#2a1a1a' },
                    ]}
                  >
                    <View
                      style={[
                        styles.vegDot,
                        {
                          backgroundColor: item.isVeg
                            ? Colors.primary
                            : '#d9504a',
                        },
                      ]}
                    />
                  </View>
                  {item.tags.slice(0, 2).map(tag => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.menuItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.menuItemDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
              </View>

              <View style={styles.menuCardRight}>
                {!item.isAvailable ? (
                  <View style={styles.unavailableChip}>
                    <Text style={styles.unavailableText}>N/A</Text>
                  </View>
                ) : count === 0 ? (
                  // FIX #6 — shows "+ Add" when nothing in cart
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => addToCart(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </TouchableOpacity>
                ) : (
                  // FIX #6 & #7 — inline stepper when item is in cart
                  <View style={styles.inlineStepper}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => removeLastSlotForItem(item.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperCount}>{count}</Text>
                    <TouchableOpacity
                      style={[styles.stepperBtn, styles.stepperBtnAdd]}
                      onPress={() => addToCart(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.stepperBtnText, styles.stepperBtnTextAdd]}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ── Bottom Bar ── */}
      {cart.length > 0 && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + clampDp(12, 8, 20) },
          ]}
        >
          <View style={styles.bottomBarLeft}>
            <Text style={styles.bottomBarCount}>
              {cart.reduce((s, e) => s + e.quantity, 0)} items •{' '}
              {uniqueItemCount} types
            </Text>
            <Text style={styles.bottomBarTotal}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.bottomBarRight}>
            <TouchableOpacity
              style={styles.cartPreviewBtn}
              onPress={() => setShowCart(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.cartPreviewBtnText}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>
                  {isEdit ? 'Update →' : 'Place →'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Cart Modal ── */}
      <Modal
        visible={showCart}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowCart(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={[
              styles.cartModal,
              { paddingBottom: insets.bottom + clampDp(8, 4, 16) },
              { maxHeight: SCREEN_HEIGHT * 0.88 },
            ]}
          >
            <View style={styles.cartModalHandle} />
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartModalTitle}>
                Order Summary
                {cart.length > 0 && (
                  <Text style={styles.cartModalCount}>
                    {' '}({uniqueItemCount} items)
                  </Text>
                )}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCart(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.cartModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {cart.length === 0 ? (
                <Text style={styles.cartEmptyText}>No items added yet.</Text>
              ) : (
                cart.map(entry => (
                  <View key={entry.slotId} style={styles.cartEntry}>
                    <View style={styles.cartEntryTop}>
                      <Text style={styles.cartEntryName} numberOfLines={2}>
                        {entry.menuItemName}
                      </Text>
                      <Text style={styles.cartEntryPrice}>
                        {formatPrice(entry.price * entry.quantity)}
                      </Text>
                    </View>
                    <View style={styles.cartEntryActions}>
                      {/* FIX #1 & #8 — qty stepper removes slot at 0 */}
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => changeQty(entry.slotId, -1)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{entry.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => changeQty(entry.slotId, 1)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      {/* FIX #12 — pass item name into note modal */}
                      <TouchableOpacity
                        style={styles.noteBtn}
                        onPress={() =>
                          setNoteModal({
                            visible: true,
                            slotId: entry.slotId,
                            note: entry.note,
                            itemName: entry.menuItemName,
                          })
                        }
                      >
                        <Text style={styles.noteBtnText} numberOfLines={1}>
                          {entry.note
                            ? '📝 ' +
                              entry.note.slice(0, 20) +
                              (entry.note.length > 20 ? '…' : '')
                            : '+ Add note'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeSlot(entry.slotId)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.removeBtnText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                    {entry.note ? (
                      <Text style={styles.cartEntryNote}>"{entry.note}"</Text>
                    ) : null}
                  </View>
                ))
              )}

              {/* FIX #11 — special instructions visible prominently in cart */}
              <View style={styles.specialBox}>
                <Text style={styles.specialLabel}>⚠️  Kitchen Instructions</Text>
                <TextInput
                  style={styles.specialInput}
                  placeholder="Allergies, special requests, birthday surprise..."
                  placeholderTextColor={Colors.textMuted}
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {cart.length > 0 && (
                <View style={styles.cartTotal}>
                  <View>
                    <Text style={styles.cartTotalLabel}>Subtotal</Text>
                    <Text style={styles.cartTotalSub}>
                      {cart.reduce((s, e) => s + e.quantity, 0)} items across{' '}
                      {uniqueItemCount} types
                    </Text>
                  </View>
                  <Text style={styles.cartTotalValue}>{formatPrice(total)}</Text>
                </View>
              )}
            </ScrollView>

            {/* FIX #2 — cart modal save button has proper loading state */}
            {cart.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  styles.cartSaveBtn,
                  saving && styles.saveBtnDisabled,
                ]}
                onPress={() => {
                  setShowCart(false);
                  handleSave();
                }}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isEdit ? 'Update Order →' : 'Place Order →'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Note Modal ── */}
      <Modal
        visible={noteModal.visible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() =>
          setNoteModal({ visible: false, slotId: '', note: '', itemName: '' })
        }
      >
        <KeyboardAvoidingView
          style={styles.noteOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.noteModal}>
            {/* FIX #12 — shows which item the note is for */}
            <Text style={styles.noteModalTitle} numberOfLines={1}>
              Note for: {noteModal.itemName}
            </Text>
            <Text style={styles.noteModalSub}>
              E.g. "medium rare", "less spicy", "no onions"
            </Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Write a note for this item..."
              placeholderTextColor={Colors.textMuted}
              value={noteModal.note}
              onChangeText={t =>
                setNoteModal(prev => ({ ...prev, note: t }))
              }
              autoFocus
              multiline
              numberOfLines={3}
            />
            <View style={styles.noteModalBtns}>
              <TouchableOpacity
                style={styles.noteCancelBtn}
                onPress={() =>
                  setNoteModal({
                    visible: false,
                    slotId: '',
                    note: '',
                    itemName: '',
                  })
                }
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
      <Modal
        visible={exitConfirm}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setExitConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            {/* FIX #13 — context-aware title */}
            <Text style={styles.confirmTitle}>
              {isEdit ? 'Discard Changes?' : 'Discard Order?'}
            </Text>
            <Text style={styles.confirmBody}>
              {isEdit
                ? 'You have unsaved changes to an existing order. Going back will lose all your edits.'
                : 'You have unsaved items. If you go back, your progress will be lost.'}
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
                onPress={() => {
                  setExitConfirm(false);
                  router.back();
                }}
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
// All fontSize uses clampSp() — ignores Android system font scale, scales with screen width
// All layout dimensions use clampDp() — scales with screen width, clamped for tiny/tablet screens

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: clampDp(12, 8, 20),
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: clampSp(14, 12, 16),
  },

  // ── Locked (delivered) screen ──────────────────────────────────────────────
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: clampDp(32, 24, 48),
    gap: clampDp(12, 8, 20),
  },
  lockedEmoji: {
    fontSize: clampSp(52, 40, 64),
    marginBottom: clampDp(8, 4, 16),
  },
  lockedTitle: {
    fontSize: clampSp(22, 18, 28),
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  lockedBody: {
    fontSize: clampSp(14, 12, 16),
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: clampSp(21, 18, 26),
  },
  lockedBtn: {
    marginTop: clampDp(8, 4, 16),
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: clampDp(32, 24, 48),
    paddingVertical: clampDp(14, 12, 18),
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  lockedBtnText: {
    fontSize: clampSp(15, 13, 17),
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: clampDp(14, 10, 20),
    paddingHorizontal: clampDp(14, 10, 20),
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: clampDp(8, 4, 12),
  },
  // FIX #15 — edit mode header has amber tint border
  headerEdit: {
    borderBottomColor: Colors.warning + '80',
    borderBottomWidth: 2,
  },
  backBtn: {
    width: clampDp(40, 36, 48),
    height: clampDp(40, 36, 48),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
  },
  backIcon: {
    fontSize: clampSp(18, 16, 22),
    color: Colors.textPrimary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: clampSp(18, 16, 22),
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  headerSubEdit: {
    color: Colors.warning,
  },
  cartBtn: {
    width: clampDp(40, 36, 48),
    height: clampDp(40, 36, 48),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartIcon: {
    fontSize: clampSp(22, 20, 26),
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    width: clampDp(18, 16, 22),
    height: clampDp(18, 16, 22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: clampSp(9, 8, 11),
    fontWeight: '800',
    color: Colors.white,
  },

  // FIX #15 — edit mode warning banner
  editBanner: {
    backgroundColor: Colors.warning + '18',
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning + '40',
    paddingHorizontal: clampDp(14, 10, 20),
    paddingVertical: clampDp(8, 6, 12),
  },
  editBannerText: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.warning,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Category Tabs ──────────────────────────────────────────────────────────
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: clampDp(12, 8, 20),
    paddingVertical: clampDp(10, 8, 14),
    gap: clampDp(8, 6, 12),
  },
  catBtn: {
    alignItems: 'center',
    paddingHorizontal: clampDp(14, 10, 20),
    paddingVertical: clampDp(8, 6, 12),
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: clampDp(3, 2, 5),
  },
  catBtnActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  catIcon: {
    fontSize: clampSp(18, 16, 22),
  },
  catLabel: {
    fontSize: clampSp(11, 10, 13),
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  catLabelActive: {
    color: Colors.primary,
  },
  catRowWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    height: clampDp(74, 68, 84),
    justifyContent: 'center',
  },
  // ── Menu List ──────────────────────────────────────────────────────────────
  menuList: {
    padding: clampDp(12, 8, 20),
    gap: clampDp(10, 8, 14),
  },
  // FIX #10 — empty category state
  emptyCategory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: clampDp(48, 32, 64),
    gap: clampDp(12, 8, 18),
  },
  emptyCategoryEmoji: {
    fontSize: clampSp(40, 32, 52),
  },
  emptyCategoryText: {
    fontSize: clampSp(14, 12, 16),
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // ── Menu Card ─────────────────────────────────────────────────────────────
  menuCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: clampDp(14, 10, 20),
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    gap: clampDp(10, 8, 14),
  },
  menuCardDisabled: {
    opacity: 0.4,
  },
  menuCardLeft: {
    flex: 1,
  },
  menuCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: clampDp(88, 76, 110),
  },
  menuCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: clampDp(5, 4, 8),
    marginBottom: clampDp(4, 3, 6),
    flexWrap: 'wrap',
  },
  vegBadge: {
    width: clampDp(16, 14, 20),
    height: clampDp(16, 14, 20),
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: clampDp(8, 7, 10),
    height: clampDp(8, 7, 10),
    borderRadius: clampDp(4, 3, 5),
  },
  tagChip: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: clampDp(6, 5, 8),
    paddingVertical: clampDp(1, 1, 2),
    borderRadius: Radius.full,
  },
  tagText: {
    fontSize: clampSp(9, 8, 11),
    color: Colors.primary,
    fontWeight: '700',
  },
  menuItemName: {
    fontSize: clampSp(14, 12, 17),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: clampDp(2, 1, 4),
  },
  menuItemDesc: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.textSecondary,
    lineHeight: clampSp(16, 14, 19),
    marginBottom: clampDp(5, 4, 8),
  },
  menuItemPrice: {
    fontSize: clampSp(14, 12, 17),
    fontWeight: '800',
    color: Colors.primary,
  },

  // plain add button (count === 0)
  addBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: clampDp(16, 12, 22),
    paddingVertical: clampDp(10, 8, 14),
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: clampSp(13, 12, 15),
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // FIX #6 — inline stepper on menu card (count > 0)
  inlineStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: clampDp(34, 30, 42),
    height: clampDp(38, 34, 46),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  stepperBtnAdd: {
    backgroundColor: Colors.primary,
  },
  stepperBtnText: {
    fontSize: clampSp(18, 16, 22),
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: clampSp(22, 20, 26),
  },
  stepperBtnTextAdd: {
    color: Colors.white,
  },
  stepperCount: {
    fontSize: clampSp(15, 13, 18),
    fontWeight: '800',
    color: Colors.primary,
    minWidth: clampDp(28, 24, 36),
    textAlign: 'center',
  },

  unavailableChip: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: clampDp(10, 8, 14),
    paddingVertical: clampDp(6, 5, 10),
  },
  unavailableText: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // ── Bottom Bar ────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: clampDp(12, 10, 18),
    paddingHorizontal: clampDp(14, 10, 20),
    gap: clampDp(10, 8, 16),
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomBarCount: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bottomBarTotal: {
    fontSize: clampSp(18, 16, 22),
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  bottomBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: clampDp(8, 6, 12),
  },
  cartPreviewBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: clampDp(14, 10, 20),
    paddingVertical: clampDp(12, 10, 16),
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cartPreviewBtnText: {
    fontSize: clampSp(13, 12, 15),
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: clampDp(20, 16, 28),
    paddingVertical: clampDp(14, 12, 18),
    minWidth: clampDp(110, 90, 140),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: clampSp(14, 13, 16),
    fontWeight: '700',
  },
  cartSaveBtn: {
    marginHorizontal: clampDp(14, 10, 20),
    marginTop: clampDp(8, 6, 12),
    marginBottom: clampDp(4, 2, 8),
  },

  // ── Cart Modal ────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  cartModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: clampDp(24, 18, 32),
    borderTopRightRadius: clampDp(24, 18, 32),
    borderTopWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cartModalHandle: {
    width: clampDp(36, 28, 48),
    height: clampDp(4, 3, 6),
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: clampDp(10, 8, 14),
    marginBottom: clampDp(4, 2, 6),
  },
  cartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: clampDp(14, 10, 20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  cartModalTitle: {
    fontSize: clampSp(18, 16, 22),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cartModalCount: {
    fontSize: clampSp(14, 12, 16),
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  cartModalClose: {
    fontSize: clampSp(16, 14, 18),
    color: Colors.textSecondary,
    padding: clampDp(4, 3, 6),
  },
  cartEmptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    padding: clampDp(32, 24, 48),
    fontSize: clampSp(14, 12, 16),
  },
  cartEntry: {
    padding: clampDp(14, 10, 20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: clampDp(8, 6, 12),
  },
  cartEntryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: clampDp(8, 6, 12),
  },
  cartEntryName: {
    fontSize: clampSp(14, 12, 16),
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  cartEntryPrice: {
    fontSize: clampSp(14, 12, 16),
    fontWeight: '700',
    color: Colors.primary,
  },
  cartEntryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: clampDp(8, 6, 12),
  },
  cartEntryNote: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: clampDp(2, 1, 4),
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: clampDp(8, 6, 12),
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: clampDp(4, 3, 6),
  },
  qtyBtn: {
    width: clampDp(30, 26, 38),
    height: clampDp(30, 26, 38),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceBorder,
    borderRadius: clampDp(6, 5, 8),
  },
  qtyBtnText: {
    fontSize: clampSp(16, 14, 20),
    color: Colors.textPrimary,
    fontWeight: '700',
    lineHeight: clampSp(20, 18, 24),
  },
  qtyValue: {
    fontSize: clampSp(14, 12, 16),
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: clampDp(20, 16, 28),
    textAlign: 'center',
  },
  noteBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm,
    paddingHorizontal: clampDp(8, 6, 12),
    paddingVertical: clampDp(8, 6, 12),
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  noteBtnText: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.textSecondary,
  },
  removeBtn: {
    padding: clampDp(4, 3, 6),
  },
  removeBtnText: {
    fontSize: clampSp(18, 16, 22),
  },

  // FIX #11 — special instructions with prominent label
  specialBox: {
    padding: clampDp(14, 10, 20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
    gap: clampDp(8, 6, 12),
  },
  specialLabel: {
    fontSize: clampSp(12, 11, 14),
    fontWeight: '700',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  specialInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: clampDp(10, 8, 14),
    fontSize: clampSp(13, 12, 15),
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    minHeight: clampDp(70, 60, 90),
    textAlignVertical: 'top',
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: clampDp(14, 10, 20),
  },
  cartTotalLabel: {
    fontSize: clampSp(16, 14, 19),
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  cartTotalSub: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.textMuted,
    marginTop: 2,
  },
  cartTotalValue: {
    fontSize: clampSp(22, 18, 28),
    fontWeight: '800',
    color: Colors.primary,
  },

  // ── Note Modal ────────────────────────────────────────────────────────────
  noteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: clampDp(20, 16, 32),
  },
  noteModal: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: clampDp(20, 16, 28),
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: clampDp(8, 6, 12),
  },
  noteModalTitle: {
    fontSize: clampSp(16, 14, 19),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  noteModalSub: {
    fontSize: clampSp(12, 11, 14),
    color: Colors.textSecondary,
  },
  noteInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: clampDp(12, 10, 16),
    fontSize: clampSp(14, 12, 16),
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    minHeight: clampDp(80, 70, 100),
    textAlignVertical: 'top',
    marginTop: clampDp(4, 2, 8),
  },
  noteModalBtns: {
    flexDirection: 'row',
    gap: clampDp(10, 8, 14),
    marginTop: clampDp(4, 2, 8),
  },
  noteCancelBtn: {
    flex: 1,
    padding: clampDp(14, 12, 18),
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
  },
  noteCancelText: {
    fontSize: clampSp(14, 13, 16),
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  noteSaveBtn: {
    flex: 1,
    padding: clampDp(14, 12, 18),
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  noteSaveText: {
    fontSize: clampSp(14, 13, 16),
    fontWeight: '700',
    color: Colors.white,
  },

  // ── Exit Confirm ──────────────────────────────────────────────────────────
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: clampDp(24, 18, 36),
  },
  confirmModal: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: clampDp(20, 16, 28),
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: clampDp(8, 6, 12),
  },
  confirmTitle: {
    fontSize: clampSp(18, 16, 22),
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  confirmBody: {
    fontSize: clampSp(13, 12, 15),
    color: Colors.textSecondary,
    lineHeight: clampSp(20, 18, 24),
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: clampDp(10, 8, 14),
    marginTop: clampDp(8, 6, 12),
  },
  confirmCancel: {
    flex: 1,
    padding: clampDp(14, 12, 18),
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: clampSp(14, 13, 16),
    fontWeight: '700',
    color: Colors.primary,
  },
  confirmDiscard: {
    flex: 1,
    padding: clampDp(14, 12, 18),
    borderRadius: Radius.md,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  confirmDiscardText: {
    fontSize: clampSp(14, 13, 16),
    fontWeight: '700',
    color: Colors.error,
  },
});