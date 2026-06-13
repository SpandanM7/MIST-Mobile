import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';

// ─── Styles ───────────────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: 0.5,
  },

  // ── Error banner ───────────────────────────────────────────────────────────
  errorBanner: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#2a1a1a',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error + '60',
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Stats Row ──────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statCount: {
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Floor Filter Row ───────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  filterBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterBtnActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.primary,
  },

  // ── Section Filter Row (second level) ─────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sectionBtnActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  sectionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  sectionBtnTextActive: {
    color: Colors.primary,
  },

  // ── Table Grid ─────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  tableCard: {
    flex: 1,
    margin: 5,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 110,
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  tableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tableNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tableCapacity: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tableStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 2,
  },
  tableStatusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tableAction: {
    position: 'absolute',
    bottom: 7,
    right: 8,
  },
  // ─── Add these entries to the existing StyleSheet in tables/_styles.ts ────────
// Paste inside the StyleSheet.create({}) block, alongside the existing `header` styles.

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hamburger: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    gap: 5,
  },
  bar: {
    height: 2,
    width: 22,
    backgroundColor: Colors.textPrimary,
    borderRadius: 2,
  },
  barMid: {
    width: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 26,
  },
  tableActionText: {
    fontSize: 14,
  },
});