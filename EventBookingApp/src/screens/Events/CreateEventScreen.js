import React, { useState } from 'react';
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
import { FormInput, Button, ErrorBanner } from '../../components';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';

const CreateEventScreen = ({ navigation }) => {
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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Event title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.date.trim()) newErrors.date = 'Event date is required';
    else {
      const d = new Date(form.date);
      if (isNaN(d.getTime())) newErrors.date = 'Use format: YYYY-MM-DD or YYYY-MM-DDTHH:mm';
    }
    if (!form.venue.trim()) newErrors.venue = 'Venue is required';
    if (!form.totalCapacity) newErrors.totalCapacity = 'Total capacity is required';
    else if (parseInt(form.totalCapacity) < 1) newErrors.totalCapacity = 'Capacity must be at least 1';
    if (form.ticketPrice === '') newErrors.ticketPrice = 'Ticket price is required';
    else if (parseFloat(form.ticketPrice) < 0) newErrors.ticketPrice = 'Price cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 800,
    });
    if (!result.didCancel && result.assets?.[0]) {
      setImage(result.assets[0]);
    }
  };

  const handleCreate = async () => {
    setError(null);
    if (!validate()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (image) {
        formData.append('image', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || 'event-image.jpg',
        });
      }

      await eventsAPI.create(formData);
      Alert.alert('✅ Success', 'Event created successfully!', [
        { text: 'View Events', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to create event';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = ['Active', 'Cancelled'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Image Picker */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker} activeOpacity={0.8}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📸</Text>
              <Text style={styles.imagePlaceholderText}>Tap to add event image</Text>
              <Text style={styles.imagePlaceholderSub}>JPG, PNG up to 5MB</Text>
            </View>
          )}
          {image && (
            <View style={styles.changeImageOverlay}>
              <Text style={styles.changeImageText}>Change Image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>Event Details</Text>

          <FormInput
            label="Event Title *"
            value={form.title}
            onChangeText={(t) => updateForm('title', t)}
            placeholder="e.g. Annual Tech Conference 2024"
            error={errors.title}
          />

          <FormInput
            label="Description *"
            value={form.description}
            onChangeText={(t) => updateForm('description', t)}
            placeholder="Describe your event..."
            multiline
            numberOfLines={4}
            error={errors.description}
          />

          <FormInput
            label="Event Date & Time *"
            value={form.date}
            onChangeText={(t) => updateForm('date', t)}
            placeholder="YYYY-MM-DDTHH:mm (e.g. 2024-12-25T18:00)"
            autoCapitalize="none"
            error={errors.date}
          />

          <FormInput
            label="Venue *"
            value={form.venue}
            onChangeText={(t) => updateForm('venue', t)}
            placeholder="e.g. Grand Ballroom, Colombo"
            error={errors.venue}
          />

          <View style={styles.row}>
            <FormInput
              label="Total Capacity *"
              value={form.totalCapacity}
              onChangeText={(t) => updateForm('totalCapacity', t.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 500"
              keyboardType="numeric"
              error={errors.totalCapacity}
              style={{ flex: 1, marginRight: SPACING.sm }}
            />
            <FormInput
              label="Ticket Price ($) *"
              value={form.ticketPrice}
              onChangeText={(t) => updateForm('ticketPrice', t.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.ticketPrice}
              style={{ flex: 1 }}
            />
          </View>

          {/* Status Selector */}
          <Text style={styles.statusLabel}>Initial Status</Text>
          <View style={styles.statusRow}>
            {statusOptions.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => updateForm('status', s)}
                style={[styles.statusOption, form.status === s && styles.statusOptionActive]}
              >
                <Text style={[styles.statusOptionText, form.status === s && styles.statusOptionTextActive]}>
                  {s === 'Active' ? '✅ Active' : '❌ Cancelled'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Create Event"
          onPress={handleCreate}
          loading={loading}
          style={styles.submitButton}
        />

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.full,
  },
  backBtnText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  scrollContent: { padding: SPACING.base },

  // Image Picker
  imagePicker: {
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.base,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  imagePlaceholderIcon: { fontSize: 40, marginBottom: SPACING.sm },
  imagePlaceholderText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  imagePlaceholderSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 4 },
  changeImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeImageText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.base },

  // Form
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionLabel: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.base,
  },
  row: { flexDirection: 'row' },
  statusLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  statusOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusOptionActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  statusOptionText: { color: COLORS.textMuted, fontWeight: '600', fontSize: FONTS.sizes.sm },
  statusOptionTextActive: { color: COLORS.primary },
  submitButton: { marginTop: SPACING.sm },
});

export default CreateEventScreen;
