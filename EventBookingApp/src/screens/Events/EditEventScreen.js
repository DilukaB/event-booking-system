import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { eventsAPI } from '../../api';
import { FormInput, Button, ErrorBanner, LoadingOverlay } from '../../components';
import { COLORS, FONTS, SPACING, RADIUS } from '../../theme';

const EditEventScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    totalCapacity: '',
    ticketPrice: '',
    status: 'Active',
  });
  const [image, setImage] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getById(eventId);
      const e = response.data.event;
      const dateStr = new Date(e.date).toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
      setForm({
        title: e.title,
        description: e.description,
        date: dateStr,
        venue: e.venue,
        totalCapacity: String(e.totalCapacity),
        ticketPrice: String(e.ticketPrice),
        status: e.status,
      });
      setExistingImageUrl(e.imageUrl);
    } catch (err) {
      setError('Failed to load event');
    } finally {
      setFetchLoading(false);
    }
  };

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Event title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.date.trim()) newErrors.date = 'Event date is required';
    if (!form.venue.trim()) newErrors.venue = 'Venue is required';
    if (!form.totalCapacity) newErrors.totalCapacity = 'Total capacity is required';
    else if (parseInt(form.totalCapacity) < 1) newErrors.totalCapacity = 'Capacity must be at least 1';
    if (form.ticketPrice === '') newErrors.ticketPrice = 'Ticket price is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (!result.didCancel && result.assets?.[0]) {
      setImage(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    setError(null);
    if (!validate()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (image) {
        formData.append('image', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || 'event-image.jpg',
        });
      }

      await eventsAPI.update(eventId, formData);
      Alert.alert('✅ Updated', 'Event updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const displayImageUri = image?.uri || existingImageUrl;
  const statusOptions = ['Active', 'Sold Out', 'Cancelled'];

  if (fetchLoading) {
    return <LoadingOverlay visible message="Loading event..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Image */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker} activeOpacity={0.8}>
          {displayImageUri ? (
            <Image source={{ uri: displayImageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📸</Text>
              <Text style={styles.imagePlaceholderText}>Tap to change image</Text>
            </View>
          )}
          <View style={styles.changeImageOverlay}>
            <Text style={styles.changeImageText}>📷 Change Image</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <FormInput
            label="Event Title *"
            value={form.title}
            onChangeText={(t) => updateForm('title', t)}
            placeholder="Event title"
            error={errors.title}
          />
          <FormInput
            label="Description *"
            value={form.description}
            onChangeText={(t) => updateForm('description', t)}
            placeholder="Event description"
            multiline
            numberOfLines={4}
            error={errors.description}
          />
          <FormInput
            label="Event Date & Time *"
            value={form.date}
            onChangeText={(t) => updateForm('date', t)}
            placeholder="YYYY-MM-DDTHH:mm"
            autoCapitalize="none"
            error={errors.date}
          />
          <FormInput
            label="Venue *"
            value={form.venue}
            onChangeText={(t) => updateForm('venue', t)}
            placeholder="Event venue"
            error={errors.venue}
          />
          <View style={styles.row}>
            <FormInput
              label="Total Capacity *"
              value={form.totalCapacity}
              onChangeText={(t) => updateForm('totalCapacity', t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              error={errors.totalCapacity}
              style={{ flex: 1, marginRight: SPACING.sm }}
            />
            <FormInput
              label="Ticket Price ($) *"
              value={form.ticketPrice}
              onChangeText={(t) => updateForm('ticketPrice', t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              error={errors.ticketPrice}
              style={{ flex: 1 }}
            />
          </View>

          <Text style={styles.statusLabel}>Status</Text>
          <View style={styles.statusRow}>
            {statusOptions.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => updateForm('status', s)}
                style={[styles.statusOption, form.status === s && styles.statusOptionActive]}
              >
                <Text style={[styles.statusOptionText, form.status === s && styles.statusOptionTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button title="Update Event" onPress={handleUpdate} loading={loading} style={styles.submitButton} />
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.base, paddingTop: SPACING.xl,
    paddingBottom: SPACING.base, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full,
  },
  backBtnText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  scrollContent: { padding: SPACING.base },
  imagePicker: {
    height: 180, borderRadius: RADIUS.xl, overflow: 'hidden',
    marginBottom: SPACING.base, borderWidth: 2, borderColor: COLORS.border,
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  imagePlaceholderIcon: { fontSize: 36, marginBottom: SPACING.xs },
  imagePlaceholderText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  changeImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  changeImageText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
  formCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.base,
    marginBottom: SPACING.base, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  row: { flexDirection: 'row' },
  statusLabel: {
    color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600',
    marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  statusRow: { flexDirection: 'row', gap: SPACING.sm },
  statusOption: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  statusOptionActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  statusOptionText: { color: COLORS.textMuted, fontWeight: '600', fontSize: FONTS.sizes.xs },
  statusOptionTextActive: { color: COLORS.primary },
  submitButton: { marginTop: SPACING.sm },
});

export default EditEventScreen;
