import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { eventsAPI, ticketsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Button, StatusBadge, ErrorBanner, LoadingOverlay } from '../../components';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width, height } = Dimensions.get('window');

const EventDetailScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const imageHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [280, 120],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getById(eventId);
      setEvent(response.data.event);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    setBookingError(null);
    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
      setBookingError('Please enter a valid quantity');
      return;
    }
    if (qty > event.availableSeats) {
      setBookingError(`Only ${event.availableSeats} seats available`);
      return;
    }

    setBookingLoading(true);
    try {
      await ticketsAPI.book({ eventId: event._id, ticketQuantity: qty });
      setShowBookingModal(false);
      Alert.alert(
        '🎉 Booking Confirmed!',
        `Successfully booked ${qty} ticket(s) for ${event.title}.\nTotal: $${(qty * event.ticketPrice).toFixed(2)}`,
        [
          { text: 'View My Tickets', onPress: () => navigation.navigate('MyTickets') },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
      fetchEvent(); // Refresh to update seat count
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsAPI.delete(eventId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const isOwnerOrAdmin = user && event && (event.createdBy?._id === user._id || user.role === 'admin');
  const canBook = event?.status === 'Active' && event?.availableSeats > 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🎪</Text>
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😞</Text>
        <Text style={styles.errorMessage}>{error || 'Event not found'}</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: SPACING.base }} />
      </View>
    );
  }

  const eventDate = new Date(event.date);
  const occupancyPct = event.totalCapacity > 0
    ? Math.round(((event.totalCapacity - event.availableSeats) / event.totalCapacity) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Parallax Hero Image */}
        <Animated.View style={[styles.heroContainer, { height: imageHeight }]}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderText}>🎪</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Owner/Admin Actions */}
          {isOwnerOrAdmin && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditEvent', { eventId: event._id })}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={[styles.actionBtn, styles.deleteBtn]}>
                <Text style={styles.actionBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title & Status */}
          <View style={styles.titleRow}>
            <StatusBadge status={event.status} />
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {eventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🕐</Text>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💺</Text>
              <Text style={styles.infoLabel}>Available</Text>
              <Text style={[styles.infoValue, { color: COLORS.primary }]}>{event.availableSeats}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🎟️</Text>
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>{event.totalCapacity}</Text>
            </View>
          </View>

          {/* Venue */}
          <View style={styles.venueCard}>
            <Text style={styles.venueIcon}>📍</Text>
            <View style={styles.venueInfo}>
              <Text style={styles.venueLabel}>Venue</Text>
              <Text style={styles.venueText}>{event.venue}</Text>
            </View>
          </View>

          {/* Occupancy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seat Availability</Text>
            <View style={styles.occupancyBar}>
              <View
                style={[
                  styles.occupancyFill,
                  {
                    width: `${occupancyPct}%`,
                    backgroundColor: occupancyPct > 80 ? COLORS.error : occupancyPct > 50 ? COLORS.warning : COLORS.success,
                  },
                ]}
              />
            </View>
            <View style={styles.occupancyLabels}>
              <Text style={styles.occupancyLabel}>{occupancyPct}% booked</Text>
              <Text style={styles.occupancyLabel}>{event.availableSeats} / {event.totalCapacity} available</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Organizer */}
          {event.createdBy && (
            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Text style={styles.organizerInitial}>{event.createdBy.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.organizerLabel}>Organized by</Text>
                <Text style={styles.organizerName}>{event.createdBy.name}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* Bottom Booking Bar */}
      <View style={[styles.bookingBar, SHADOWS.lg]}>
        <View>
          <Text style={styles.priceLabel}>Price per ticket</Text>
          <Text style={styles.priceValue}>
            {event.ticketPrice === 0 ? 'FREE' : `$${event.ticketPrice.toFixed(2)}`}
          </Text>
        </View>
        <Button
          title={canBook ? 'Book Now' : event.status === 'Sold Out' ? 'Sold Out' : event.status}
          onPress={() => { setBookingError(null); setQuantity('1'); setShowBookingModal(true); }}
          disabled={!canBook}
          style={styles.bookButton}
        />
      </View>

      {/* Booking Modal */}
      <Modal visible={showBookingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, SHADOWS.lg]}>
            <Text style={styles.modalTitle}>Book Tickets</Text>
            <Text style={styles.modalSubtitle}>{event.title}</Text>

            {bookingError && (
              <ErrorBanner message={bookingError} onDismiss={() => setBookingError(null)} />
            )}

            <Text style={styles.modalLabel}>Number of Tickets</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                onPress={() => setQuantity(String(Math.max(1, parseInt(quantity || '1') - 1)))}
                style={styles.quantityBtn}
              >
                <Text style={styles.quantityBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                value={quantity}
                onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.quantityInput}
                textAlign="center"
              />
              <TouchableOpacity
                onPress={() => setQuantity(String(Math.min(event.availableSeats, parseInt(quantity || '1') + 1)))}
                style={styles.quantityBtn}
              >
                <Text style={styles.quantityBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>
                ${((parseInt(quantity) || 0) * event.ticketPrice).toFixed(2)}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowBookingModal(false)}
                style={styles.modalCancelBtn}
              />
              <Button
                title="Confirm Booking"
                onPress={handleBook}
                loading={bookingLoading}
                style={styles.modalConfirmBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  loadingEmoji: { fontSize: 48, marginBottom: SPACING.base },
  loadingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
  errorContainer: {
    flex: 1, backgroundColor: COLORS.background, alignItems: 'center',
    justifyContent: 'center', padding: SPACING.xl,
  },
  errorEmoji: { fontSize: 48, marginBottom: SPACING.base },
  errorMessage: { color: COLORS.error, fontSize: FONTS.sizes.base, textAlign: 'center' },

  // Hero
  heroContainer: { width: '100%', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { fontSize: 80 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.base,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RADIUS.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  ownerActions: {
    position: 'absolute',
    top: 50,
    right: SPACING.base,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RADIUS.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: { backgroundColor: 'rgba(255, 71, 87, 0.7)' },
  actionBtnText: { fontSize: 18 },

  // Content
  contentContainer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  titleRow: { marginBottom: SPACING.sm },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: SPACING.base,
  },

  // Info Grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.base },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  infoIcon: { fontSize: 24, marginBottom: 4 },
  infoLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '700', textAlign: 'center' },

  // Venue
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  venueIcon: { fontSize: 28, marginRight: SPACING.md },
  venueInfo: { flex: 1 },
  venueLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textTransform: 'uppercase' },
  venueText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.base, fontWeight: '700' },

  // Occupancy
  section: { marginBottom: SPACING.base },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  occupancyBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  occupancyFill: { height: '100%', borderRadius: RADIUS.full },
  occupancyLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  occupancyLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },

  // Description
  description: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    lineHeight: 24,
  },

  // Organizer
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  organizerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  organizerInitial: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.lg },
  organizerLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textTransform: 'uppercase' },
  organizerName: { color: COLORS.textPrimary, fontWeight: '700', fontSize: FONTS.sizes.base },

  // Booking Bar
  bookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  priceLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  priceValue: { color: COLORS.primary, fontSize: FONTS.sizes.xxl, fontWeight: '900' },
  bookButton: { flex: 0, paddingHorizontal: SPACING.xl },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, marginBottom: SPACING.xl },
  modalLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.sm },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    marginBottom: SPACING.base,
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quantityBtnText: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  quantityInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    paddingVertical: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGlow,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  totalLabel: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONTS.sizes.base },
  totalAmount: { color: COLORS.primary, fontSize: FONTS.sizes.xl, fontWeight: '900' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
  modalCancelBtn: { flex: 1 },
  modalConfirmBtn: { flex: 2 },
});

export default EventDetailScreen;
