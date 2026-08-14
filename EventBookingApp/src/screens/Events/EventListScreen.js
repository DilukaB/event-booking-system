import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { eventsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, EmptyState, Card } from '../../components';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';

const EventListScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState(null);

  const statusFilters = ['', 'Active', 'Sold Out', 'Cancelled'];

  const fetchEvents = useCallback(async (searchVal = search, statusVal = filterStatus) => {
    try {
      const params = {};
      if (searchVal) params.search = searchVal;
      if (statusVal) params.status = statusVal;
      const response = await eventsAPI.getAll(params);
      setEvents(response.data.events);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    fetchEvents();
  }, [filterStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchEvents(search, filterStatus), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const renderEventCard = ({ item, index }) => {
    const eventDate = new Date(item.date);
    const isUpcoming = eventDate > new Date();
    const occupancyPct = item.totalCapacity > 0
      ? Math.round(((item.totalCapacity - item.availableSeats) / item.totalCapacity) * 100)
      : 0;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EventDetail', { eventId: item._id })}
        activeOpacity={0.9}
        style={[styles.cardWrapper, SHADOWS.md]}
      >
        {/* Event Image */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.eventImage} resizeMode="cover" />
          ) : (
            <View style={[styles.eventImage, styles.imagePlaceholder]}>
              <Text style={styles.imagePlaceholderText}>🎪</Text>
            </View>
          )}
          <View style={styles.imageOverlay} />
          <View style={styles.badgeContainer}>
            <StatusBadge status={item.status} />
          </View>
          {isUpcoming && <View style={styles.upcomingTag}><Text style={styles.upcomingText}>Upcoming</Text></View>}
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>
              {eventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText} numberOfLines={1}>{item.venue}</Text>
          </View>

          {/* Occupancy bar */}
          <View style={styles.occupancyContainer}>
            <View style={styles.occupancyBar}>
              <View style={[styles.occupancyFill, { width: `${occupancyPct}%`, backgroundColor: occupancyPct > 80 ? COLORS.accent : COLORS.primary }]} />
            </View>
            <Text style={styles.occupancyText}>{item.availableSeats} seats left</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.priceText}>
              {item.ticketPrice === 0 ? 'FREE' : `$${item.ticketPrice.toFixed(2)}`}
            </Text>
            <View style={styles.bookNowBtn}>
              <Text style={styles.bookNowText}>View →</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.heroSubtitle}>Discover amazing events</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('MyTickets')} style={styles.ticketsButton}>
              <Text style={styles.ticketsButtonIcon}>🎫</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Sign Out',
                  'Are you sure you want to sign out?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: logout },
                  ]
                );
              }}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutButtonIcon}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search events, venues..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Pills */}
        <View style={styles.filterRow}>
          {statusFilters.map((status) => (
            <TouchableOpacity
              key={status || 'all'}
              onPress={() => setFilterStatus(status)}
              style={[styles.filterPill, filterStatus === status && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, filterStatus === status && styles.filterPillTextActive]}>
                {status || 'All Events'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>⏳</Text>
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="🎭"
            title={search ? 'No results found' : 'No events available'}
            subtitle={search ? `No events match "${search}"` : 'Check back soon for upcoming events!'}
            actionText={search ? 'Clear Search' : null}
            onAction={search ? () => setSearch('') : null}
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

      {/* FAB - Create Event */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateEvent')}
        style={[styles.fab, SHADOWS.lg]}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroHeader: {
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    marginBottom: SPACING.base,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.sm,
  },
  greeting: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ticketsButton: {
    backgroundColor: COLORS.primaryGlow,
    borderRadius: RADIUS.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ticketsButtonIcon: { fontSize: 20 },
  logoutButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.12)',
    borderRadius: RADIUS.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.4)',
  },
  logoutButtonIcon: { fontSize: 18 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    paddingVertical: SPACING.md,
  },
  clearSearch: { color: COLORS.textMuted, fontSize: 16, padding: SPACING.xs },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
  },
  filterPill: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  filterPillText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  filterPillTextActive: { color: COLORS.primary },
  listContent: { paddingHorizontal: SPACING.base, paddingBottom: 100 },

  // Event Card
  cardWrapper: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  imageContainer: { height: 180, position: 'relative' },
  eventImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { fontSize: 48 },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  badgeContainer: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  upcomingTag: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(108, 99, 255, 0.9)',
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
  },
  upcomingText: { color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  cardContent: { padding: SPACING.base },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    lineHeight: 24,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaIcon: { fontSize: 13, marginRight: 6 },
  metaText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1 },
  occupancyContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  occupancyBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  occupancyFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  occupancyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  priceText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: '900',
  },
  bookNowBtn: {
    backgroundColor: COLORS.primaryGlow,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bookNowText: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.sm },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: { fontSize: 48, marginBottom: SPACING.base },
  loadingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },

  // FAB
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { color: COLORS.white, fontSize: 28, fontWeight: '300', lineHeight: 32 },
});

export default EventListScreen;
