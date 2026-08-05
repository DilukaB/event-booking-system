import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { ticketsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, EmptyState, Button } from '../../components';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';

const MyTicketsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const response = await ticketsAPI.getMyTickets(params);
      setTickets(response.data.tickets);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleCancel = (ticket) => {
    Alert.alert(
      'Cancel Ticket',
      `Cancel ${ticket.ticketQuantity} ticket(s) for "${ticket.eventId?.title}"?\nYour seats will be released back.`,
      [
        { text: 'Keep Ticket', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await ticketsAPI.cancel(ticket._id);
              fetchTickets();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel ticket');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (ticket) => {
    Alert.alert(
      'Delete Ticket',
      'Remove this ticket from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ticketsAPI.delete(ticket._id);
              fetchTickets();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete ticket');
            }
          },
        },
      ]
    );
  };

  const renderTicket = ({ item }) => {
    const event = item.eventId;
    const bookedDate = new Date(item.bookedAt);
    const eventDate = event?.date ? new Date(event.date) : null;
    const isConfirmed = item.status === 'Confirmed';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('TicketDetail', { ticketId: item._id })}
        activeOpacity={0.9}
        style={[styles.ticketCard, SHADOWS.sm]}
      >
        {/* Ticket left notch effect */}
        <View style={styles.ticketLeftNotch} />
        <View style={styles.ticketRightNotch} />
        <View style={styles.ticketDivider} />

        {/* Header */}
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderLeft}>
            <Text style={styles.ticketEventName} numberOfLines={2}>
              {event?.title || 'Unknown Event'}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <View style={styles.ticketQtyBadge}>
            <Text style={styles.ticketQtyText}>×{item.ticketQuantity}</Text>
            <Text style={styles.ticketQtyLabel}>tickets</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.ticketDetails}>
          {eventDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>
                {eventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          )}
          {event?.venue && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText} numberOfLines={1}>{event.venue}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🗓️</Text>
            <Text style={styles.detailText}>Booked: {bookedDate.toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.ticketFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalAmount}>${item.totalAmount?.toFixed(2)}</Text>
          </View>
          <View style={styles.ticketActions}>
            {isConfirmed && (
              <TouchableOpacity
                onPress={() => handleCancel(item)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
            {!isConfirmed && (
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* User Info */}
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitial}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tickets.filter(t => t.status === 'Confirmed').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tickets.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            ${tickets.filter(t => t.status === 'Confirmed').reduce((s, t) => s + (t.totalAmount || 0), 0).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {['', 'Confirmed', 'Cancelled'].map((s) => (
          <TouchableOpacity
            key={s || 'all'}
            onPress={() => setFilterStatus(s)}
            style={[styles.filterPill, filterStatus === s && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, filterStatus === s && styles.filterPillTextActive]}>
              {s || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>My Tickets ({tickets.length})</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🎫</Text>
        <Text style={styles.loadingText}>Loading your tickets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>My Tickets</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="🎫"
            title="No tickets yet"
            subtitle="Book your first event and your tickets will appear here!"
            actionText="Explore Events"
            onAction={() => navigation.navigate('EventList')}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  screenHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.base, paddingTop: SPACING.xl, paddingBottom: SPACING.base,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full,
  },
  backBtnText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  screenTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  loadingEmoji: { fontSize: 48, marginBottom: SPACING.base },
  loadingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
  listContent: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.xxl },

  // Header section
  headerSection: { marginBottom: SPACING.sm },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.base, marginBottom: SPACING.base, marginTop: SPACING.base,
    borderWidth: 1, borderColor: COLORS.cardBorder, gap: SPACING.md,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  userInitial: { color: COLORS.primary, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.base },
  userEmail: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  logoutBtn: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)', borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.error,
  },
  logoutText: { color: COLORS.error, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  statNumber: { color: COLORS.primary, fontSize: FONTS.sizes.xl, fontWeight: '900' },
  statLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  filterPill: {
    paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceLight,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  filterPillText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  filterPillTextActive: { color: COLORS.primary },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: '800', marginBottom: SPACING.sm },

  // Ticket Card (ticket-style design)
  ticketCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'visible',
    padding: SPACING.base,
  },
  ticketLeftNotch: {
    position: 'absolute', left: -1, top: '50%',
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.background, marginTop: -10,
    zIndex: 1,
  },
  ticketRightNotch: {
    position: 'absolute', right: -1, top: '50%',
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.background, marginTop: -10,
    zIndex: 1,
  },
  ticketDivider: {
    position: 'absolute', left: '10%', right: '10%', top: '55%',
    height: 1, borderTopWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  ticketHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: SPACING.md,
  },
  ticketHeaderLeft: { flex: 1, marginRight: SPACING.sm },
  ticketEventName: {
    color: COLORS.textPrimary, fontSize: FONTS.sizes.base, fontWeight: '800',
    marginBottom: SPACING.xs, lineHeight: 22,
  },
  ticketQtyBadge: {
    backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.md,
    padding: SPACING.sm, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary, minWidth: 52,
  },
  ticketQtyText: { color: COLORS.primary, fontSize: FONTS.sizes.xl, fontWeight: '900' },
  ticketQtyLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  ticketDetails: { marginBottom: SPACING.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailIcon: { fontSize: 12, marginRight: 6 },
  detailText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1 },
  ticketFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1, borderColor: COLORS.border,
  },
  totalLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  totalAmount: { color: COLORS.primary, fontSize: FONTS.sizes.lg, fontWeight: '900' },
  ticketActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)', borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderColor: COLORS.error,
  },
  cancelBtnText: { color: COLORS.error, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  deleteBtnText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
});

export default MyTicketsScreen;
