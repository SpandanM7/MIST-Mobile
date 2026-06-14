import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import {
  fetchMenuCategories,
  fetchMenuItems,
  MenuCategory,
  MenuItem,
  Addon,
} from '@/services/menu';
import { submitTakeoutOrder, TakeoutOrderPayload } from '@/services/orders';
import CustomAlert, { AlertButton } from '@/components/Customalert';
import { styles } from './_takeoutStyles';
import { clampDp, SCREEN_HEIGHT } from './_utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type CartEntry = {
  slotId: string;
  menuItemId: string;
  menuItemName: string;
  categoryId: string;
  price: number;
  quantity: number;
  note: string;
  variantId: string | null;
  variantName: string | null;
  variantPrice: number | null;
  selectedAddons: Addon[];
};

type PickerModalState = {
  visible: boolean;
  item: MenuItem | null;
  selectedVariantId: string | null;
  selectedAddonIds: Set<string>;
};

type DiscountType = '%' | '₹';
type PaymentMethod = 'Cash' | 'Card' | 'UPI';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const entryUnitPrice = (entry: CartEntry): number => {
  const base = entry.variantPrice !== null ? entry.variantPrice : entry.price;
  const addonSum = entry.selectedAddons.reduce((s, a) => s + a.price, 0);
  return base + addonSum;
};

const calcTotal = (cart: CartEntry[]) =>
  cart.reduce((sum, e) => sum + entryUnitPrice(e) * e.quantity, 0);

const formatPrice = (p: number) => `₹${p.toFixed(2).replace(/\.00$/, '')}`;

const entrySubtitle = (entry: CartEntry): string | null => {
  const parts: string[] = [];
  if (entry.variantName) parts.push(entry.variantName);
  if (entry.selectedAddons.length > 0)
    parts.push(entry.selectedAddons.map(a => a.name).join(', '));
  return parts.length > 0 ? parts.join(' · ') : null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TakeoutScreen() {
  const insets = useSafeAreaInsets();

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

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // ─── Billing fields ────────────────────────────────────────────────────────

  const [phoneNumber, setPhoneNumber] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('%');
  const [discountValue, setDiscountValue] = useState('0');
  const [cgstPercent, setCgstPercent] = useState('9');
  const [sgstPercent, setSgstPercent] = useState('9');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');

  // ─── Note modal ────────────────────────────────────────────────────────────

  const [noteModal, setNoteModal] = useState<{
    visible: boolean;
    slotId: string;
    note: string;
    itemName: string;
  }>({ visible: false, slotId: '', note: '', itemName: '' });

  // ─── Variant/Addon picker ──────────────────────────────────────────────────

  const [picker, setPicker] = useState<PickerModalState>({
    visible: false,
    item: null,
    selectedVariantId: null,
    selectedAddonIds: new Set(),
  });

  const openPicker = (item: MenuItem) => {
    setPicker({
      visible: true,
      item,
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
        categoryId: item.categoryId,
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

  // ─── Cart actions ──────────────────────────────────────────────────────────

  const updateQty = (slotId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(e => (e.slotId === slotId ? { ...e, quantity: e.quantity + delta } : e))
        .filter(e => e.quantity > 0),
    );
  };

  const removeEntry = (slotId: string) => {
    setCart(prev => prev.filter(e => e.slotId !== slotId));
  };

  const openNoteModal = (entry: CartEntry) => {
    setNoteModal({ visible: true, slotId: entry.slotId, note: entry.note, itemName: entry.menuItemName });
  };

  const saveNote = () => {
    setCart(prev =>
      prev.map(e => (e.slotId === noteModal.slotId ? { ...e, note: noteModal.note } : e)),
    );
    setNoteModal({ visible: false, slotId: '', note: '', itemName: '' });
  };

  // ─── Load menu ─────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    try {
      const [cats, items] = await Promise.all([fetchMenuCategories(), fetchMenuItems()]);
      setCategories(cats);
      setMenuItems(items);
      if (cats.length) setActiveCategory(cats[0].id);
    } catch {
      showAlert('Error', 'Failed to load menu. Please go back and try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ─── Bill calculations ─────────────────────────────────────────────────────

  const subtotal = calcTotal(cart);
  const discountAmount =
    discountType === '%'
      ? (subtotal * (parseFloat(discountValue) || 0)) / 100
      : parseFloat(discountValue) || 0;
  const afterDiscount = Math.max(subtotal - discountAmount, 0);
  const cgstAmount = (afterDiscount * (parseFloat(cgstPercent) || 0)) / 100;
  const sgstAmount = (afterDiscount * (parseFloat(sgstPercent) || 0)) / 100;
  const grandTotal = afterDiscount + cgstAmount + sgstAmount;

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (cart.length === 0) {
      showAlert('Empty Cart', 'Please add at least one item before submitting.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload: TakeoutOrderPayload = {
        type: 'TAKEAWAY',
        phoneNumber: phoneNumber.trim(),
        subtotal,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        discountAmount,
        cgstPercent: parseFloat(cgstPercent) || 0,
        sgstPercent: parseFloat(sgstPercent) || 0,
        cgstAmount,
        sgstAmount,
        grandTotal,
        paymentMethod,
        items: cart.map(entry => {
          const category = categories.find(c => c.id === entry.categoryId)?.name ?? '';
          const unitPrice = entry.variantPrice !== null ? entry.variantPrice : entry.price;
          const addonSum = entry.selectedAddons.reduce((s, a) => s + a.price, 0);
          return {
            dishName: entry.menuItemName,
            category,
            quantity: entry.quantity,
            unitPrice,
            totalPrice: (unitPrice + addonSum) * entry.quantity,
            addonNames: entry.selectedAddons.map(a => a.name),
            addonPrices: entry.selectedAddons.map(a => a.price),
          };
        }),
      };

      await submitTakeoutOrder(payload);

      showAlert('Order Placed', 'Takeout order placed successfully.', 'success', [
        {
          text: 'OK',
          onPress: () => {
            setAlert(prev => ({ ...prev, visible: false }));
            router.back();
          },
        },
      ]);
    } catch (e: any) {
      showAlert('Failed', e?.message ?? 'Could not place the order.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const totalQty = cart.reduce((s, e) => s + e.quantity, 0);

  // Cart bar absorbs the Android 3-button nav bar height
  const cartBarBottomPadding = insets.bottom + clampDp(14, 12, 18);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + clampDp(8, 6, 14) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.75}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Takeout Order</Text>
          <Text style={styles.headerSubtitle}>
            {cart.length > 0
              ? `${totalQty} item${totalQty > 1 ? 's' : ''} in cart`
              : 'New takeaway'}
          </Text>
        </View>
        <View style={{ width: clampDp(38, 34, 46) }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      ) : (
        <>
          {/* ── Category tabs — View wrapper locks height; ScrollView scrolls sideways ── */}
          <View style={styles.categoryBarWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryBar}
              contentContainerStyle={styles.categoryBarContent}
              alwaysBounceHorizontal={false}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryTab, activeCategory === cat.id && styles.categoryTabActive]}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.categoryTabText,
                      activeCategory === cat.id && styles.categoryTabTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Menu list ── */}
          <FlatList
            data={menuItems.filter(i => i.categoryId === activeCategory)}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.menuList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.menuCard, !item.isAvailable && styles.menuCardDisabled]}
                onPress={() => item.isAvailable && openPicker(item)}
                activeOpacity={0.8}
                disabled={!item.isAvailable}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
                  {!item.isAvailable && (
                    <Text style={styles.menuItemUnavailable}>Unavailable</Text>
                  )}
                </View>
                {item.isAvailable && (
                  <View style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />

          {/* ── Bottom cart bar — paddingBottom absorbs Android nav bar ── */}
          <TouchableOpacity
            style={[
              styles.cartBar,
              cart.length === 0 && styles.cartBarDisabled,
              { paddingBottom: cartBarBottomPadding },
            ]}
            onPress={() => cart.length > 0 && setShowCart(true)}
            activeOpacity={0.85}
            disabled={cart.length === 0}
          >
            <Text
              style={[
                styles.cartBarText,
                cart.length === 0 && styles.cartBarTextDisabled,
              ]}
            >
              {cart.length === 0
                ? 'Cart is empty'
                : `${totalQty} item${totalQty > 1 ? 's' : ''} · ${formatPrice(calcTotal(cart))}`}
            </Text>
            {cart.length > 0 && (
              <Text style={styles.cartBarArrow}>View Order →</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* ─── Cart / Billing Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showCart}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowCart(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.cartModal, { maxHeight: SCREEN_HEIGHT * 0.9 }]}>
            {/* drag handle */}
            <View style={styles.cartModalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Summary</Text>
              <TouchableOpacity
                onPress={() => setShowCart(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {cart.map(entry => (
                <View key={entry.slotId} style={styles.cartEntry}>
                  <View style={styles.cartEntryTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartEntryName}>{entry.menuItemName}</Text>
                      {entrySubtitle(entry) && (
                        <Text style={styles.cartEntrySubtitle}>{entrySubtitle(entry)}</Text>
                      )}
                      {entry.note ? (
                        <Text style={styles.cartEntryNote}>📝 {entry.note}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.cartEntryPrice}>
                      {formatPrice(entryUnitPrice(entry) * entry.quantity)}
                    </Text>
                  </View>
                  <View style={styles.cartEntryActions}>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQty(entry.slotId, -1)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{entry.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQty(entry.slotId, 1)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.noteBtn}
                      onPress={() => openNoteModal(entry)}
                    >
                      <Text style={styles.noteBtnText}>
                        {entry.note ? 'Edit Note' : '+ Note'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeEntry(entry.slotId)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.removeBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Customer details */}
              <View style={styles.billSection}>
                <Text style={styles.billSectionTitle}>Customer Details</Text>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Enter phone number"
                  placeholderTextColor={Colors.textMuted}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>

              {/* Discount */}
              <View style={styles.billSection}>
                <Text style={styles.billSectionTitle}>Discount</Text>
                <View style={styles.discountRow}>
                  <View style={styles.discountTypeToggle}>
                    <TouchableOpacity
                      style={[styles.discountTypeBtn, discountType === '%' && styles.discountTypeBtnActive]}
                      onPress={() => setDiscountType('%')}
                    >
                      <Text
                        style={[
                          styles.discountTypeText,
                          discountType === '%' && styles.discountTypeTextActive,
                        ]}
                      >
                        %
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.discountTypeBtn, discountType === '₹' && styles.discountTypeBtnActive]}
                      onPress={() => setDiscountType('₹')}
                    >
                      <Text
                        style={[
                          styles.discountTypeText,
                          discountType === '₹' && styles.discountTypeTextActive,
                        ]}
                      >
                        ₹
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.fieldInput, styles.discountInput]}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* GST */}
              <View style={styles.billSection}>
                <Text style={styles.billSectionTitle}>GST</Text>
                <View style={styles.gstRow}>
                  <View style={styles.gstField}>
                    <Text style={styles.fieldLabel}>CGST %</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={cgstPercent}
                      onChangeText={setCgstPercent}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.gstField}>
                    <Text style={styles.fieldLabel}>SGST %</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={sgstPercent}
                      onChangeText={setSgstPercent}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Payment method */}
              <View style={styles.billSection}>
                <Text style={styles.billSectionTitle}>Payment Method</Text>
                <View style={styles.paymentRow}>
                  {(['Cash', 'Card', 'UPI'] as PaymentMethod[]).map(method => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.paymentBtn, paymentMethod === method && styles.paymentBtnActive]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        style={[
                          styles.paymentBtnText,
                          paymentMethod === method && styles.paymentBtnTextActive,
                        ]}
                      >
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Bill summary */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={styles.summaryValueDiscount}>− {formatPrice(discountAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>CGST ({cgstPercent || 0}%)</Text>
                  <Text style={styles.summaryValue}>{formatPrice(cgstAmount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>SGST ({sgstPercent || 0}%)</Text>
                  <Text style={styles.summaryValue}>{formatPrice(sgstAmount)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                  <Text style={styles.summaryTotalValue}>{formatPrice(grandTotal)}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Place Takeout Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Variant/Addon Picker Modal ────────────────────────────────────── */}
      <Modal
        visible={picker.visible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={closePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { maxHeight: SCREEN_HEIGHT * 0.85 }]}>
            {picker.item && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {picker.item.name}
                  </Text>
                  <TouchableOpacity
                    onPress={closePicker}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {picker.item.variants.length > 0 && (
                    <View style={styles.pickerSection}>
                      <Text style={styles.pickerSectionTitle}>Choose Variant</Text>
                      {picker.item.variants.map(v => (
                        <TouchableOpacity
                          key={v.id}
                          style={[
                            styles.pickerOption,
                            picker.selectedVariantId === v.id && styles.pickerOptionActive,
                          ]}
                          onPress={() => setPicker(prev => ({ ...prev, selectedVariantId: v.id }))}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.pickerOptionText}>{v.name}</Text>
                          <Text style={styles.pickerOptionPrice}>{formatPrice(v.price)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {picker.item.addons.length > 0 && (
                    <View style={styles.pickerSection}>
                      <Text style={styles.pickerSectionTitle}>Add-ons (optional)</Text>
                      {picker.item.addons.map(a => (
                        <TouchableOpacity
                          key={a.id}
                          style={[
                            styles.pickerOption,
                            picker.selectedAddonIds.has(a.id) && styles.pickerOptionActive,
                          ]}
                          onPress={() => toggleAddon(a.id)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.pickerOptionText}>{a.name}</Text>
                          <Text style={styles.pickerOptionPrice}>
                            +{formatPrice(a.price)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.pickerConfirmBtn,
                    { paddingBottom: insets.bottom + clampDp(16, 14, 20) },
                  ]}
                  onPress={confirmPicker}
                  activeOpacity={0.85}
                >
                  <Text style={styles.pickerConfirmText}>Add to Order</Text>
                  <Text style={styles.pickerConfirmPrice}>{formatPrice(pickerTotal)}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Note Modal ─────────────────────────────────────────────────────── */}
      <Modal
        visible={noteModal.visible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setNoteModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.noteOverlay}>
          <View style={styles.noteModalBox}>
            <Text style={styles.noteModalTitle}>Add Note</Text>
            <Text style={styles.noteModalSub}>{noteModal.itemName}</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. less spicy, no onions..."
              placeholderTextColor={Colors.textMuted}
              value={noteModal.note}
              onChangeText={text => setNoteModal(prev => ({ ...prev, note: text }))}
              multiline
              autoFocus
            />
            <View style={styles.noteModalBtns}>
              <TouchableOpacity
                style={styles.noteCancelBtn}
                onPress={() => setNoteModal(prev => ({ ...prev, visible: false }))}
              >
                <Text style={styles.noteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.noteSaveBtn} onPress={saveNote}>
                <Text style={styles.noteSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert {...alert} onDismiss={() => setAlert(prev => ({ ...prev, visible: false }))} />
    </View>
  );
}