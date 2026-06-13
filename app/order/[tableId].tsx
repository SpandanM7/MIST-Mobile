import { Colors, Radius } from '@/constants/theme';
import {
  fetchMenuCategories,
  fetchMenuItems,
  fetchOrderByTable,
  MenuCategory,
  MenuItem,
  Variant,
  Addon,
  OrderItem,
  submitOrder,
  addItemsToOrder,
  updateItemQuantity,
} from '@/services/restaurant';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { styles } from './_styles';
import { sp, dp, clampSp, clampDp, SCREEN_HEIGHT  } from './_utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type CartEntry = {
  slotId: string;
  menuItemId: string;
  menuItemName: string;
  // base price of the item (no variant, no addons)
  price: number;
  quantity: number;
  note: string;
  // Variant — null when item has no variants
  variantId: string | null;
  variantName: string | null;
  variantPrice: number | null;
  // Addons — selected by user (optional)
  selectedAddons: Addon[];
  // orderItemId is set only for items already in a live backend order (edit mode)
  orderItemId?: string;
};

// State for the variant/addon picker modal
type PickerModal = {
  visible: boolean;
  item: MenuItem | null;
  selectedVariantId: string | null;
  selectedAddonIds: Set<string>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

// Effective unit price for a cart entry = variantPrice (if any) + sum of addon prices
const entryUnitPrice = (entry: CartEntry): number => {
  const base = entry.variantPrice !== null ? entry.variantPrice : entry.price;
  const addonSum = entry.selectedAddons.reduce((s, a) => s + a.price, 0);
  return base + addonSum;
};

const calcTotal = (cart: CartEntry[]) =>
  cart.reduce((sum, e) => sum + entryUnitPrice(e) * e.quantity, 0);

const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

// Build a human-readable subtitle for a cart entry showing variant + addons
const entrySubtitle = (entry: CartEntry): string | null => {
  const parts: string[] = [];
  if (entry.variantName) parts.push(entry.variantName);
  if (entry.selectedAddons.length > 0)
    parts.push(entry.selectedAddons.map(a => a.name).join(', '));
  return parts.length > 0 ? parts.join(' · ') : null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    tableId: string;
    tableNumber: string;
    status: string;
  }>();
  const { tableId, tableNumber, status } = params;

  const isEdit = status === 'occupied' || status === 'bill_requested';

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

  const existingOrderIdRef = useRef<string | null>(null);

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [originalCartLength, setOriginalCartLength] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCart, setShowCart] = useState(false);
  const [noteModal, setNoteModal] = useState<{
    visible: boolean;
    slotId: string;
    note: string;
    itemName: string;
  }>({ visible: false, slotId: '', note: '', itemName: '' });
  const [exitConfirm, setExitConfirm] = useState(false);

  // ─── Variant / Addon Picker ────────────────────────────────────────────────

  const [picker, setPicker] = useState<PickerModal>({
    visible: false,
    item: null,
    selectedVariantId: null,
    selectedAddonIds: new Set(),
  });

  const openPicker = (item: MenuItem) => {
    setPicker({
      visible: true,
      item,
      // Pre-select first variant if there is one
      selectedVariantId: item.variants.length > 0 ? item.variants[0].id : null,
      selectedAddonIds: new Set(),
    });
  };

  const closePicker = () =>
    setPicker({ visible: false, item: null, selectedVariantId: null, selectedAddonIds: new Set() });

  const toggleAddon = (addonId: string) => {
    setPicker(prev => {
      const next = new Set(prev.selectedAddonIds);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return { ...prev, selectedAddonIds: next };
    });
  };

  const confirmPicker = () => {
    const { item, selectedVariantId, selectedAddonIds } = picker;
    if (!item) return;

    // Variant is mandatory if the item has variants
    if (item.variants.length > 0 && !selectedVariantId) {
      showAlert('Select a Variant', `Please choose a variant for ${item.name}.`, 'warning');
      return;
    }

    const chosenVariant = item.variants.find(v => v.id === selectedVariantId) ?? null;
    const chosenAddons = item.addons.filter(a => selectedAddonIds.has(a.id));

    setCart(prev => [
      ...prev,
      {
        slotId: uid(),
        menuItemId: item.id,
        menuItemName: item.name,
        price: item.price,
        quantity: 1,
        note: '',
        variantId: chosenVariant?.id ?? null,
        variantName: chosenVariant?.name ?? null,
        variantPrice: chosenVariant?.price ?? null,
        selectedAddons: chosenAddons,
      },
    ]);
    closePicker();
  };

  // Derived picker total for the confirm button
  const pickerTotal = (() => {
    const { item, selectedVariantId, selectedAddonIds } = picker;
    if (!item) return 0;
    const variant = item.variants.find(v => v.id === selectedVariantId);
    const base = variant ? variant.price : item.price;
    const addonsSum = item.addons
      .filter(a => selectedAddonIds.has(a.id))
      .reduce((s, a) => s + a.price, 0);
    return base + addonsSum;
  })();

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
          existingOrderIdRef.current = existing.id;
          setSpecialInstructions('');
          const loadedCart: CartEntry[] = existing.items.map(item => ({
            slotId: uid(),
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            price: item.price,
            quantity: item.quantity,
            note: '',
            variantId: item.variantId,
            variantName: item.variantName,
            variantPrice: item.variantPrice,
            selectedAddons: [], // backend doesn't return addon detail on existing items
            orderItemId: (item as any).orderItemId,
          }));
          setCart(loadedCart);
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
      if (picker.visible) {
        closePicker();
        return true;
      }
      if (showCart) {
        setShowCart(false);
        return true;
      }
      const hasChanges =
        cart.length > 0 || (isEdit && originalCartLength > 0 && cart.length === 0);
      if (hasChanges) {
        setExitConfirm(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [cart.length, showCart, isEdit, originalCartLength, picker.visible]);

  // ─── Cart operations ───────────────────────────────────────────────────────

  // For items with variants/addons, always open the picker.
  // For plain items (no variants, no addons), add directly.
  const addToCart = (item: MenuItem) => {
    if (item.variants.length > 0 || item.addons.length > 0) {
      openPicker(item);
    } else {
      setCart(prev => [
        ...prev,
        {
          slotId: uid(),
          menuItemId: item.id,
          menuItemName: item.name,
          price: item.price,
          quantity: 1,
          note: '',
          variantId: null,
          variantName: null,
          variantPrice: null,
          selectedAddons: [],
        },
      ]);
    }
  };

  // Removes the last added slot for an item (used by the inline − button on menu cards)
  const removeLastSlotForItem = (itemId: string) => {
    setCart(prev => {
      const lastIdx = [...prev].map(e => e.menuItemId).lastIndexOf(itemId);
      if (lastIdx === -1) return prev;
      return prev.filter((_, i) => i !== lastIdx);
    });
  };

  const removeSlot = (slotId: string) =>
    setCart(prev => prev.filter(e => e.slotId !== slotId));

  const changeQty = (slotId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(e => {
          if (e.slotId !== slotId) return e;
          const q = e.quantity + delta;
          if (q < 1) return null;
          return { ...e, quantity: q };
        })
        .filter(Boolean) as CartEntry[]
    );
  };

  const saveNote = () => {
    setCart(prev =>
      prev.map(e =>
        e.slotId === noteModal.slotId ? { ...e, note: noteModal.note } : e
      )
    );
    setNoteModal({ visible: false, slotId: '', note: '', itemName: '' });
  };

  const cartCountForItem = (itemId: string) =>
    cart
      .filter(e => e.menuItemId === itemId)
      .reduce((s, e) => s + e.quantity, 0);

  const uniqueItemCount = new Set(cart.map(e => e.menuItemId)).size;

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (cart.length === 0) {
      showAlert('Empty Order', 'Please add at least one item to the order.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const orderId = existingOrderIdRef.current;

      // Map CartEntry → OrderItem for the API
      const toOrderItem = (e: CartEntry): OrderItem => ({
        menuItemId: e.menuItemId,
        menuItemName: e.menuItemName,
        price: e.price,
        quantity: e.quantity,
        note: e.note,
        variantId: e.variantId,
        variantName: e.variantName,
        variantPrice: e.variantPrice,
        addonIds: e.selectedAddons.map(a => a.id),
        addonNames: e.selectedAddons.map(a => a.name),
        addonTotal: e.selectedAddons.reduce((s, a) => s + a.price, 0),
      });

      if (isEdit && orderId) {
        const newEntries = cart.filter(e => !e.orderItemId);
        const existingEntries = cart.filter(e => e.orderItemId);

        if (newEntries.length > 0) {
          await addItemsToOrder(orderId, newEntries.map(toOrderItem));
        }

        for (const entry of existingEntries) {
          if (entry.orderItemId) {
            await updateItemQuantity(orderId, entry.orderItemId, entry.quantity);
          }
        }
      } else {
        await submitOrder(tableId, cart.map(toOrderItem));
      }

      showAlert(
        isEdit ? 'Order Updated!' : 'Order Placed!',
        `Table ${tableNumber} order has been ${isEdit ? 'updated' : 'submitted'} successfully.`,
        'success',
        [{ text: 'OK', onPress: () => router.replace('/tables' as any) }]
      );
    } catch (e: any) {
      showAlert('Error', e?.message ?? 'Failed to save the order. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
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
          {uniqueItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{uniqueItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Edit mode warning banner */}
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
              {cat.icon ? (
                <Text style={styles.catIcon}>{cat.icon}</Text>
              ) : (
                <Text style={styles.catIcon}>🍽️</Text>
              )}
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
        ListEmptyComponent={
          <View style={styles.emptyCategory}>
            <Text style={styles.emptyCategoryEmoji}>🍽️</Text>
            <Text style={styles.emptyCategoryText}>No items in this category</Text>
          </View>
        }
        renderItem={({ item }) => {
          const count = cartCountForItem(item.id);
          const hasVariants = item.variants.length > 0;
          const hasAddons = item.addons.length > 0;
          return (
            <View
              style={[
                styles.menuCard,
                !item.isAvailable && styles.menuCardDisabled,
              ]}
            >
              <View style={styles.menuCardLeft}>
                <View style={styles.menuCardTop}>
                  {item.isVeg !== undefined && (
                    <View
                      style={[
                        styles.vegBadge,
                        { backgroundColor: item.isVeg ? '#1a2a1a' : '#2a1a1a' },
                      ]}
                    >
                      <View
                        style={[
                          styles.vegDot,
                          { backgroundColor: item.isVeg ? Colors.primary : '#d9504a' },
                        ]}
                      />
                    </View>
                  )}
                  {(item.tags ?? []).slice(0, 2).map(tag => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {/* Variant / addon hint badges */}
                  {hasVariants && (
                    <View style={styles.variantHintChip}>
                      <Text style={styles.variantHintText}>Variants</Text>
                    </View>
                  )}
                  {hasAddons && (
                    <View style={styles.addonHintChip}>
                      <Text style={styles.addonHintText}>Add-ons</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.menuItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={styles.menuItemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                {/* Show base price; if has variants, label it as "from" */}
                <Text style={styles.menuItemPrice}>
                  {hasVariants
                    ? `from ${formatPrice(Math.min(...item.variants.map(v => v.price)))}`
                    : formatPrice(item.price)}
                </Text>
              </View>

              <View style={styles.menuCardRight}>
                {!item.isAvailable ? (
                  <View style={styles.unavailableChip}>
                    <Text style={styles.unavailableText}>N/A</Text>
                  </View>
                ) : count === 0 ? (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => addToCart(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.addBtnText}>
                      {hasVariants || hasAddons ? '+ Choose' : '+ Add'}
                    </Text>
                  </TouchableOpacity>
                ) : (
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

      {/* ══════════════════════════════════════════════════════════════════════
          ── Variant / Addon Picker Modal ──
          Opens when user taps Add on an item that has variants or addons.
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={picker.visible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={closePicker}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.pickerModal,
              { paddingBottom: insets.bottom + clampDp(8, 4, 16) },
              { maxHeight: SCREEN_HEIGHT * 0.85 },
            ]}
          >
            <View style={styles.cartModalHandle} />

            {/* Picker header */}
            <View style={styles.cartModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartModalTitle} numberOfLines={1}>
                  {picker.item?.name}
                </Text>
                {picker.item && (
                  <Text style={styles.pickerSubtitle}>
                    {picker.item.variants.length > 0
                      ? 'Choose a variant, then any add-ons'
                      : 'Choose your add-ons'}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={closePicker}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.cartModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

              {/* ── Variants section (mandatory if present) ── */}
              {picker.item && picker.item.variants.length > 0 && (
                <View style={styles.pickerSection}>
                  <View style={styles.pickerSectionHeader}>
                    <Text style={styles.pickerSectionTitle}>Variants</Text>
                    <View style={styles.requiredChip}>
                      <Text style={styles.requiredChipText}>Required</Text>
                    </View>
                  </View>
                  {picker.item.variants.map(variant => {
                    const selected = picker.selectedVariantId === variant.id;
                    return (
                      <TouchableOpacity
                        key={variant.id}
                        style={[styles.pickerRow, selected && styles.pickerRowSelected]}
                        onPress={() =>
                          setPicker(prev => ({ ...prev, selectedVariantId: variant.id }))
                        }
                        activeOpacity={0.75}
                      >
                        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                          {selected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.pickerRowName, selected && styles.pickerRowNameSelected]}>
                          {variant.name}
                        </Text>
                        <Text style={[styles.pickerRowPrice, selected && styles.pickerRowPriceSelected]}>
                          {formatPrice(variant.price)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* ── Addons section (optional) ── */}
              {picker.item && picker.item.addons.length > 0 && (
                <View style={styles.pickerSection}>
                  <View style={styles.pickerSectionHeader}>
                    <Text style={styles.pickerSectionTitle}>Add-ons</Text>
                    <View style={styles.optionalChip}>
                      <Text style={styles.optionalChipText}>Optional</Text>
                    </View>
                  </View>
                  {picker.item.addons.map(addon => {
                    const selected = picker.selectedAddonIds.has(addon.id);
                    return (
                      <TouchableOpacity
                        key={addon.id}
                        style={[styles.pickerRow, selected && styles.pickerRowSelected]}
                        onPress={() => toggleAddon(addon.id)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.checkboxOuter, selected && styles.checkboxOuterSelected]}>
                          {selected && <Text style={styles.checkboxTick}>✓</Text>}
                        </View>
                        <Text style={[styles.pickerRowName, selected && styles.pickerRowNameSelected]}>
                          {addon.name}
                        </Text>
                        <Text style={[styles.pickerRowPrice, selected && styles.pickerRowPriceSelected]}>
                          +{formatPrice(addon.price)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Spacer so content clears the confirm button */}
              <View style={{ height: clampDp(80, 64, 100) }} />
            </ScrollView>

            {/* Confirm button */}
            <TouchableOpacity
              style={styles.pickerConfirmBtn}
              onPress={confirmPicker}
              activeOpacity={0.85}
            >
              <Text style={styles.pickerConfirmText}>
                Add to Order
              </Text>
              <Text style={styles.pickerConfirmPrice}>
                {formatPrice(pickerTotal)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                cart.map(entry => {
                  const subtitle = entrySubtitle(entry);
                  const unitPrice = entryUnitPrice(entry);
                  return (
                    <View key={entry.slotId} style={styles.cartEntry}>
                      <View style={styles.cartEntryTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cartEntryName} numberOfLines={2}>
                            {entry.menuItemName}
                          </Text>
                          {subtitle ? (
                            <Text style={styles.cartEntrySubtitle} numberOfLines={2}>
                              {subtitle}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.cartEntryPrice}>
                          {formatPrice(unitPrice * entry.quantity)}
                        </Text>
                      </View>
                      <View style={styles.cartEntryActions}>
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
                  );
                })
              )}

              {/* Kitchen instructions */}
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
                  setNoteModal({ visible: false, slotId: '', note: '', itemName: '' })
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

      <CustomAlert
        {...alert}
        onDismiss={() => setAlert(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

