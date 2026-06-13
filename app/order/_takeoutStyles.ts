import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { clampSp, clampDp } from './_utils';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: clampDp(10, 8, 14),
  },
  backBtn: {
    width: clampDp(36, 32, 44),
    height: clampDp(36, 32, 44),
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: clampSp(24, 20, 28),
    color: Colors.textPrimary,
    fontWeight: '700',
    lineHeight: clampSp(24, 20, 28),
  },
  headerTitle: {
    fontSize: clampSp(18, 16, 22),
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── Loading ─────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: clampSp(14, 12, 16),
  },

  // ── Category Bar ────────────────────────────────────────────────────────
  categoryBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  categoryBarContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  categoryTabActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: clampSp(13, 12, 15),
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: Colors.primary,
  },

  // ── Menu List ───────────────────────────────────────────────────────────
  menuList: {
    padding: Spacing.md,
    paddingBottom: clampDp(90, 80, 110),
    gap: clampDp(10, 8, 14),
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: clampDp(14, 12, 18),
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: clampDp(10, 8, 14),
  },
  menuCardDisabled: {
    opacity: 0.5,
  },
  menuItemName: {
    fontSize: clampSp(15, 13, 17),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  menuItemPrice: {
    fontSize: clampSp(13, 12, 15),
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  menuItemUnavailable: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.error,
    marginTop: 4,
    fontWeight: '600',
  },
  addBtn: {
    width: clampDp(34, 30, 40),
    height: clampDp(34, 30, 40),
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: clampSp(20, 18, 24),
    color: Colors.primary,
    fontWeight: '800',
    lineHeight: clampSp(20, 18, 24),
  },

  // ── Bottom Cart Bar ─────────────────────────────────────────────────────
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: clampDp(14, 12, 18),
    paddingHorizontal: Spacing.lg,
  },
  cartBarDisabled: {
    backgroundColor: Colors.surfaceElevated,
  },
  cartBarText: {
    fontSize: clampSp(14, 12, 16),
    fontWeight: '700',
    color: Colors.white,
  },
  cartBarArrow: {
    fontSize: clampSp(13, 12, 15),
    fontWeight: '700',
    color: Colors.white,
  },

  // ── Modal Shared ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: clampDp(16, 14, 22),
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  modalTitle: {
    fontSize: clampSp(17, 15, 20),
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalClose: {
    fontSize: clampSp(18, 16, 22),
    color: Colors.textSecondary,
  },

  // ── Cart Modal ──────────────────────────────────────────────────────────
  cartModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },

  // ── Cart Entries ────────────────────────────────────────────────────────
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
  },
  cartEntrySubtitle: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.textSecondary,
    marginTop: clampDp(2, 1, 4),
    fontStyle: 'italic',
  },
  cartEntryNote: {
    fontSize: clampSp(11, 10, 13),
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: clampDp(2, 1, 4),
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
    textAlign: 'center',
  },
  removeBtn: {
    padding: clampDp(4, 3, 6),
  },
  removeBtnText: {
    fontSize: clampSp(18, 16, 22),
  },

  // ── Billing Sections ────────────────────────────────────────────────────
  billSection: {
    padding: clampDp(14, 10, 20),
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: clampDp(8, 6, 12),
  },
  billSectionTitle: {
    fontSize: clampSp(13, 12, 15),
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: clampSp(11, 10, 13),
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: clampDp(12, 10, 16),
    fontSize: clampSp(14, 12, 16),
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
  },

  // ── Discount ────────────────────────────────────────────────────────────
  discountRow: {
    flexDirection: 'row',
    gap: clampDp(10, 8, 14),
    alignItems: 'center',
  },
  discountTypeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  discountTypeBtn: {
    paddingHorizontal: clampDp(16, 14, 20),
    paddingVertical: clampDp(12, 10, 16),
  },
  discountTypeBtnActive: {
    backgroundColor: Colors.primaryGlow,
  },
  discountTypeText: {
    fontSize: clampSp(14, 12, 16),
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  discountTypeTextActive: {
    color: Colors.primary,
  },
  discountInput: {
    flex: 1,
  },

  // ── GST ─────────────────────────────────────────────────────────────────
  gstRow: {
    flexDirection: 'row',
    gap: clampDp(10, 8, 14),
  },
  gstField: {
    flex: 1,
    gap: clampDp(6, 4, 8),
  },

  // ── Payment Method ──────────────────────────────────────────────────────
  paymentRow: {
    flexDirection: 'row',
    gap: clampDp(10, 8, 14),
  },
  paymentBtn: {
    flex: 1,
    paddingVertical: clampDp(12, 10, 16),
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  paymentBtnActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  paymentBtnText: {
    fontSize: clampSp(13, 12, 15),
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  paymentBtnTextActive: {
    color: Colors.primary,
  },

  // ── Summary ─────────────────────────────────────────────────────────────
  summaryBox: {
    padding: clampDp(16, 14, 22),
    gap: clampDp(8, 6, 12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: clampSp(13, 12, 15),
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: clampSp(13, 12, 15),
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  summaryValueDiscount: {
    fontSize: clampSp(13, 12, 15),
    color: Colors.error,
    fontWeight: '600',
  },
  summaryTotalRow: {
    marginTop: clampDp(8, 6, 12),
    paddingTop: clampDp(12, 10, 16),
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  summaryTotalLabel: {
    fontSize: clampSp(16, 14, 19),
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: clampSp(20, 18, 26),
    fontWeight: '800',
    color: Colors.primary,
  },

  // ── Submit Button ───────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: clampDp(16, 14, 20),
    alignItems: 'center',
    margin: clampDp(14, 12, 18),
    borderRadius: Radius.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: clampSp(16, 14, 19),
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // ── Picker Modal ────────────────────────────────────────────────────────
  pickerModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  pickerSection: {
    padding: clampDp(16, 14, 22),
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    gap: clampDp(8, 6, 12),
  },
  pickerSectionTitle: {
    fontSize: clampSp(13, 12, 15),
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: clampDp(12, 10, 16),
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
  },
  pickerOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  pickerOptionText: {
    fontSize: clampSp(14, 12, 16),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pickerOptionPrice: {
    fontSize: clampSp(13, 12, 15),
    fontWeight: '700',
    color: Colors.primary,
  },
  pickerConfirmBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: clampDp(16, 14, 20),
    margin: clampDp(14, 12, 18),
    borderRadius: Radius.md,
  },
  pickerConfirmText: {
    fontSize: clampSp(15, 13, 17),
    fontWeight: '700',
    color: Colors.white,
  },
  pickerConfirmPrice: {
    fontSize: clampSp(15, 13, 17),
    fontWeight: '800',
    color: Colors.white,
  },

  // ── Note Modal ──────────────────────────────────────────────────────────
  noteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: clampDp(20, 16, 32),
  },
  noteModalBox: {
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
});