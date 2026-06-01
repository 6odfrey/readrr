import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { proposeMeetup } from '../services/swapsService';
import { VenueCategory } from '../models/Swap';

interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
}

interface VenueChip {
  category: VenueCategory;
  label: string;
  emoji: string;
  color: string;
}

const VENUE_CHIPS: VenueChip[] = [
  { category: 'coffee_shop',    label: 'Coffee Shop',     emoji: '☕', color: '#92400e' },
  { category: 'library',        label: 'Library',          emoji: '📚', color: '#1e40af' },
  { category: 'bookshop',       label: 'Bookshop',         emoji: '📖', color: '#5b21b6' },
  { category: 'bar',            label: 'Bar',              emoji: '🍺', color: '#c2410c' },
  { category: 'book_club',      label: 'Book Club',        emoji: '📗', color: '#166534' },
  { category: 'community_space',label: 'Community Space',  emoji: '🏛',  color: '#0f766e' },
  { category: 'other',          label: 'Other',            emoji: '📍', color: '#4b5563' },
];

interface Props {
  visible: boolean;
  swapId: string;
  proposerId: string;
  otherUserCity?: string | null;
  isCounterProposal?: boolean;
  onDone: () => void;
  onCancel: () => void;
}

export default function MeetupModal({
  visible,
  swapId,
  proposerId,
  otherUserCity,
  isCounterProposal = false,
  onDone,
  onCancel,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<VenueCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<NominatimResult | null>(null);
  const [customVenueName, setCustomVenueName] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (query: string, chip: VenueChip | null) => {
    const q = [query.trim(), chip?.label, otherUserCity].filter(Boolean).join(' ');
    if (!q) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=en`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'readrr-app' },
      });
      const json: NominatimResult[] = await res.json();
      setSearchResults(json);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [otherUserCity]);

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    setSelectedResult(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const chip = VENUE_CHIPS.find((c) => c.category === selectedCategory) || null;
      runSearch(text, chip);
    }, 500);
  };

  const handleChipPress = (chip: VenueChip) => {
    const next = selectedCategory === chip.category ? null : chip.category;
    setSelectedCategory(next);
    setSelectedResult(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const activeChip = next ? VENUE_CHIPS.find((c) => c.category === next) || null : null;
    runSearch(searchQuery, activeChip);
  };

  const handleResultPress = (result: NominatimResult) => {
    setSelectedResult(result);
    setCustomVenueName(result.name);
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Pick a category', 'Please select what kind of place this is.');
      return;
    }
    const venueName = selectedResult?.name || customVenueName.trim();
    if (!venueName) {
      Alert.alert('Enter a place', 'Please search for or type a venue name.');
      return;
    }

    setSubmitting(true);
    try {
      await proposeMeetup(
        swapId,
        proposerId,
        venueName,
        selectedCategory,
        selectedResult?.display_name || undefined
      );
      resetState();
      onDone();
    } catch {
      Alert.alert('Error', 'Failed to suggest meetup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedResult(null);
    setCustomVenueName('');
    setHasSearched(false);
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  const canSubmit =
    selectedCategory !== null && (selectedResult !== null || customVenueName.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 36 : 24,
            maxHeight: '85%',
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: '#d1d5db',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700' }}>
              {isCounterProposal ? 'Suggest somewhere different' : 'Suggest a meetup spot'}
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={{ fontSize: 15, color: '#6b7280' }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, color: '#6b7280', paddingHorizontal: 20, marginBottom: 14 }}>
            Pick a safe public place to exchange your books.
          </Text>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}
            style={{ marginBottom: 16 }}
          >
            {VENUE_CHIPS.map((chip) => {
              const active = selectedCategory === chip.category;
              return (
                <TouchableOpacity
                  key={chip.category}
                  onPress={() => handleChipPress(chip)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: active ? chip.color : '#e5e7eb',
                    backgroundColor: active ? chip.color + '18' : '#f9fafb',
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 15 }}>{chip.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: active ? '600' : '400',
                      color: active ? chip.color : '#374151',
                    }}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Search input */}
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={handleQueryChange}
                placeholder="Search by name..."
                placeholderTextColor="#9ca3af"
                autoCorrect={false}
                style={{ flex: 1, fontSize: 16, color: '#1f2937' }}
              />
              {searching && <ActivityIndicator size="small" color="#9ca3af" />}
              {searchQuery.length > 0 && !searching && (
                <TouchableOpacity onPress={() => handleQueryChange('')}>
                  <Text style={{ fontSize: 15, color: '#9ca3af' }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search results */}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => String(item.place_id)}
              style={{ maxHeight: 180, marginBottom: 8 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleResultPress(item)}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f3f4f6',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#1f2937' }}>
                    {item.name || item.display_name.split(',')[0]}
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Manual entry fallback */}
          {hasSearched && searchResults.length === 0 && !searching && (
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
                No results found — or enter the name manually:
              </Text>
              <TextInput
                value={customVenueName}
                onChangeText={setCustomVenueName}
                placeholder="e.g. Central Library, The Book Nook..."
                placeholderTextColor="#9ca3af"
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: '#1f2937',
                }}
              />
            </View>
          )}

          {/* Selected venue preview */}
          {(selectedResult || customVenueName.trim()) && (
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 12,
                padding: 12,
                backgroundColor: '#f0fdf4',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#bbf7d0',
              }}
            >
              <Text style={{ fontSize: 13, color: '#15803d', fontWeight: '600', marginBottom: 2 }}>
                ✓ Selected venue
              </Text>
              <Text style={{ fontSize: 15, color: '#1f2937', fontWeight: '500' }}>
                {selectedResult?.name || customVenueName.trim()}
              </Text>
              {selectedResult?.display_name && (
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }} numberOfLines={1}>
                  {selectedResult.display_name}
                </Text>
              )}
            </View>
          )}

          {/* Submit */}
          <View style={{ paddingHorizontal: 20 }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              style={{
                backgroundColor: canSubmit ? '#38B6FF' : '#d1d5db',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                  Suggest This Place
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
