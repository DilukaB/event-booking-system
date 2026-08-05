import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { ticketsAPI } from '../../api';
import { StatusBadge, Button, LoadingOverlay } from '../../components';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';

const TicketDetailScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await ticketsAPI.getById(ticketId);
      setTicket(response.data.ticket);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ticket',
      'Are you sure you want to cancel this ticket? Your seats will be released.',
      [
        { text: 'Keep Ticket', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await ticketsAPI.cancel(ticketId);
              fetchTicket();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel ticket');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete Ticket', 'Remove this ticket from your history?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await ticketsAPI.delete(ticketId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete ticket');
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingOverlay visible message="Loading ticket..." />;

  if (error || !ticket) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😞</Text>
        <Text style={styles.errorText}>{error || 'Ticket not found'}</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: SPACING.base }} />
      </View>
    );
  }

  const event = ticket.eventId;
  const bookedDate = new Date(ticket.bookedAt);
  const eventDate = event?.date ? new Date(event.date) : null;
  const isConfirmed = ticket.status === 'Confirmed';

  // Generate mock ticket number from ID
  const ticketNumber = ticket._id.slice(-8).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LoadingOverlay visible={actionLoading} message="Processing..." />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Ticket Design */}
        <View style={[styles.bigTicket, SHADOWS.lg]}>
          {/* Top section */}
          <View style={styles.ticketTop}>
            <View style={styles.ticketTopHeader}>
              <Text style={styles.appName}>🎫 EventPass</Text>
              <StatusBadge status={ticket.status} />
            </View>
            <Text style={styles.ticketEventName}>{event?.title || 'Event'}</Text>

            {eventDate && (
              <Text style={styles.ticketEventDate}>
                {eventDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {'  '}
                {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}

            {event?.venue && (
              <View style={styles.venueRow}>
                <Text style={styles.venueIcon}>📍</Text>
                <Text style={styles.venueText}>{event.venue}</Text>
              </View>
            )}
          </View>

          {/* Tear line */}
          <View style={styles.tearLine}>
            <View style={styles.tearCircleLeft} />
            <View style={styles.tearDashes} />
            <View style={styles.tearCircleRight} />
          </View>

          {/* Bottom section */}
          <View style={styles.ticketBottom}>
            <View style={styles.ticketInfoGrid}>
              <View style={styles.ticketInfoItem}>
                <Text style={styles.ticketInfoLabel}>Ticket No.</Text>
                <Text style={styles.ticketInfoValue}>{ticketNumber}</Text>
              </View>
              <View style={styles.ticketInfoItem}>
                <Text style={styles.ticketInfoLabel}>Quantity</Text>
                <Text style={[styles.ticketInfoValue, { color: COLORS.primary }]}>×{ticket.ticketQuantity}</Text>
              </View>
              <View style={styles.ticketInfoItem}>
                <Text style={styles.ticketInfoLabel}>Per Ticket</Text>
                <Text style={styles.ticketInfoValue}>${event?.ticketPrice?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.ticketInfoItem}>
                <Text style={styles.ticketInfoLabel}>Total</Text>
                <Text style={[styles.ticketInfoValue, { color: COLORS.success, fontWeight: '900' }]}>
                  ${ticket.totalAmount?.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.barcodeSection}>
              {/* Visual barcode representation */}
              <View style={styles.barcode}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.barcodeBar,
                      {
                        height: [1, 3, 5, 7, 9, 13, 17, 19, 23].includes(i) ? 44 : 32,
                        width: [2, 5, 11, 14, 20, 25].includes(i) ? 3 : 1.5,
                        backgroundColor: isConfirmed ? COLORS.textPrimary : COLORS.textMuted,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.barcodeText}>{ticketNumber}</Text>
            </View>

            <View style={styles.bookedInfo}>
              <Text style={styles.bookedLabel}>Booked on</Text>
              <Text style={styles.bookedDate}>
                {bookedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>

            {ticket.userId && (
              <View style={styles.bookedBy}>
                <Text style={styles.bookedByLabel}>Booked by: </Text>
                <Text style={styles.bookedByName}>{ticket.userId.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {isConfirmed ? (
            <>
              <Button
                title="🚫 Cancel Ticket"
                variant="danger"
                onPress={handleCancel}
                style={styles.actionBtn}
              />
              <Button
                title="View Event"
                variant="outline"
                onPress={() => navigation.navigate('EventDetail', { eventId: event?._id })}
                style={styles.actionBtn}
              />
            </>
          ) : (
            <>
              <Button
                title="🗑️ Delete History"
                variant="secondary"
                onPress={handleDelete}
                style={styles.actionBtn}
              />
              <Button
                title="View Event"
                variant="outline"
                onPress={() => navigation.navigate('EventDetail', { eventId: event?._id })}
                style={styles.actionBtn}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.base, paddingTop: SPACING.xl, paddingBottom: SPACING.base,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full,
  },
  backBtnText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  errorContainer: {
    flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl,
  },
  errorEmoji: { fontSize: 48, marginBottom: SPACING.base },
  errorText: { color: COLORS.error, textAlign: 'center', fontSize: FONTS.sizes.base },

  // Big Ticket
  bigTicket: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  ticketTop: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    background: COLORS.surface,
  },
  ticketTopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.base },
  appName: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '800' },
  ticketEventName: {
    color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: '900',
    lineHeight: 28, marginBottom: SPACING.sm,
  },
  ticketEventDate: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },
  venueRow: { flexDirection: 'row', alignItems: 'center' },
  venueIcon: { fontSize: 14, marginRight: 6 },
  venueText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1 },

  // Tear Line
  tearLine: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: -1, position: 'relative',
  },
  tearCircleLeft: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.background, marginLeft: -12,
  },
  tearDashes: {
    flex: 1, height: 1, borderTopWidth: 2,
    borderColor: COLORS.border, borderStyle: 'dashed',
  },
  tearCircleRight: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.background, marginRight: -12,
  },

  // Bottom
  ticketBottom: { padding: SPACING.xl },
  ticketInfoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.base, marginBottom: SPACING.xl,
  },
  ticketInfoItem: { flex: 1, minWidth: '40%' },
  ticketInfoLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textTransform: 'uppercase', marginBottom: 2 },
  ticketInfoValue: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: '800' },

  // Barcode
  barcodeSection: { alignItems: 'center', marginBottom: SPACING.base },
  barcode: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginBottom: 8 },
  barcodeBar: { borderRadius: 1 },
  barcodeText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, letterSpacing: 4, fontFamily: 'monospace' },

  // Booked info
  bookedInfo: { alignItems: 'center', marginBottom: SPACING.xs },
  bookedLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  bookedDate: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  bookedBy: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  bookedByLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  bookedByName: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '700' },

  // Actions
  actions: { gap: SPACING.sm },
  actionBtn: {},
});

export default TicketDetailScreen;
