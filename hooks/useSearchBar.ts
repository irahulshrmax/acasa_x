// lib/hooks/useSearchBar.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  Location,
  TabType,
  SearchParams,
  SearchBarState,
  SearchBarActions,
  UseSearchBarReturn
} from '@/types/SearchBar';

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_TAB: TabType = 'Buy';
const DEFAULT_CITY_ID = 71;
const DEBOUNCE_DELAY = 300;
const SUGGESTIONS_LIMIT = 10;
const QUICK_LOCATIONS_LIMIT = 4;

// ─── Fallback Locations ─────────────────────────────────────────────────────

const FALLBACK_LOCATIONS: Location[] = [
  {
    id: 1125,
    name: 'Palm Jumeirah',
    slug: 'palm-jumeirah',
    latitude: null,
    longitude: null,
    property_count: 151,
    is_popular: 1,
  },
  {
    id: 35,
    name: 'Dubai Hills Estate',
    slug: 'dubai-hills-estate',
    latitude: null,
    longitude: null,
    property_count: 70,
    is_popular: 1,
  },
  {
    id: 75,
    name: 'Sheikh Zayed Road',
    slug: 'sheikh-zayed-road',
    latitude: null,
    longitude: null,
    property_count: 45,
    is_popular: 1,
  },
  {
    id: 2,
    name: 'Al Barari',
    slug: 'al-barari',
    latitude: null,
    longitude: null,
    property_count: 30,
    is_popular: 1,
  },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseSearchBarOptions {
  initialTab?: TabType;
  initialQuery?: string;
  initialLocations?: Location[];
  cityId?: number;
  debounceDelay?: number;
  onSearch?: (params: SearchParams) => void;
  persistState?: boolean;
}

// ─── Helper: Extract Locations from Properties ───────────────────────────────

function extractLocationsFromProperties(properties: any[]): Map<number, Location> {
  const uniqueLocations = new Map<number, Location>();

  properties.forEach((prop: any) => {
    // ✅ Multiple sources se community name try karo
    const communityName =
      prop.community_name ||
      prop.location ||
      prop.extra?.community_name ||
      null;

    const communityId =
      prop.extra?.community_id ||
      prop.community_id ||
      null;

    const cityName =
      prop.city_name ||
      prop.extra?.city_name ||
      null;

    console.log(
      `📍 Property ${prop.id}: community_id=${communityId}, community_name=${communityName}, city=${cityName}`
    );

    if (communityId && communityName && !uniqueLocations.has(communityId)) {
      uniqueLocations.set(communityId, {
        id: communityId,
        name: communityName,
        slug: prop.slug || '',
        latitude: null,
        longitude: null,
        property_count: 1,
        is_popular: 0,
        city_id: prop.city_id || prop.extra?.city_id || undefined,
        city_name: cityName || undefined,
      });
    }
  });

  return uniqueLocations;
}

// ─── Helper: Extract Locations from Projects ────────────────────────────────

function extractLocationsFromProjects(projects: any[]): Map<number, Location> {
  const uniqueLocations = new Map<number, Location>();

  projects.forEach((proj: any) => {
    const communityName =
      proj.community_name ||
      proj.location ||
      proj.extra?.community_name ||
      null;

    const communityId =
      proj.extra?.community_id ||
      proj.community_id ||
      null;

    const cityName =
      proj.city_name ||
      proj.extra?.city_name ||
      null;

    if (communityId && communityName && !uniqueLocations.has(communityId)) {
      uniqueLocations.set(communityId, {
        id: communityId,
        name: communityName,
        slug: proj.slug || '',
        latitude: null,
        longitude: null,
        property_count: 1,
        is_popular: 0,
        city_id: proj.city_id || proj.extra?.city_id || undefined,
        city_name: cityName || undefined,
      });
    }
  });

  return uniqueLocations;
}

// ─── Helper: Get Search-specific Fallback ───────────────────────────────────

function getSearchFallback(searchTerm?: string): Location[] {
  if (!searchTerm) return FALLBACK_LOCATIONS;

  const lower = searchTerm.toLowerCase();

  // Specific search term ke liye filtered fallback
  const filtered = FALLBACK_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(lower)
  );

  // Agar specific match mila toh wo return karo
  if (filtered.length > 0) return filtered;

  // Warna full fallback
  return FALLBACK_LOCATIONS;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useSearchBar(options: UseSearchBarOptions = {}): UseSearchBarReturn {
  const {
    initialTab = DEFAULT_TAB,
    initialQuery = '',
    initialLocations = [],
    cityId = DEFAULT_CITY_ID,
    debounceDelay = DEBOUNCE_DELAY,
    onSearch,
    persistState = true,
  } = options;

  // ─── State ──────────────────────────────────────────────────────────────

  const [activeTab, setActiveTabState] = useState<TabType>(initialTab);
  const [query, setQueryState] = useState(initialQuery);
  const [activeLocations, setActiveLocationsState] = useState<Location[]>(initialLocations);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [quickLocations, setQuickLocations] = useState<Location[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ─── Refs ────────────────────────────────────────────────────────────────

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // ─── Memoized Values ────────────────────────────────────────────────────

  const selectedIds = useMemo(() => {
    return activeLocations.map((l) => l.id);
  }, [activeLocations]);

  // ─── API Call: fetchLocations ────────────────────────────────────────────

  const fetchLocations = useCallback(
    async (params: {
      search?: string;
      popular?: boolean;
      limit?: number;
    } = {}): Promise<Location[]> => {
      try {
        // ✅ Existing API URL
        const url = new URL('/api/v1/location', window.location.origin);

        url.searchParams.set('city_id', String(cityId));

        if (params.search && params.search.length > 0) {
          url.searchParams.set('q', params.search);
        }
        if (params.limit) {
          url.searchParams.set('limit', String(params.limit));
        }
        if (params.popular) {
          url.searchParams.set('featured', 'true');
        }

        console.log('📍 Fetching locations from:', url.toString());

        const res = await fetch(url.toString());

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log('📍 Full API Response:', JSON.stringify(data, null, 2));

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch locations');
        }

        let locations: Location[] = [];

        // ─── Step 1: Properties se locations extract karo ───────────────
        if (
          data.data?.properties &&
          Array.isArray(data.data.properties) &&
          data.data.properties.length > 0
        ) {
          const uniqueLocations = extractLocationsFromProperties(
            data.data.properties
          );
          locations = Array.from(uniqueLocations.values());

          console.log(
            `📍 Extracted ${locations.length} locations from properties`
          );
        }

        // ─── Step 2: Agar properties se nahi mila toh projects try karo ─
        if (
          locations.length === 0 &&
          data.data?.projects &&
          Array.isArray(data.data.projects) &&
          data.data.projects.length > 0
        ) {
          const uniqueLocations = extractLocationsFromProjects(
            data.data.projects
          );
          locations = Array.from(uniqueLocations.values());

          console.log(
            `📍 Extracted ${locations.length} locations from projects (fallback)`
          );
        }

        // ─── Step 3: Direct location array check ────────────────────────
        if (locations.length === 0 && data.data && Array.isArray(data.data)) {
          locations = data.data
            .filter((loc: any) => loc.id && loc.name)
            .map((loc: any) => ({
              id: loc.id,
              name: loc.name,
              slug: loc.slug || '',
              latitude: loc.latitude || null,
              longitude: loc.longitude || null,
              property_count: Number(loc.property_count) || 0,
              is_popular: Number(loc.is_popular) || 0,
              city_id: loc.city_id || undefined,
              city_name: loc.city_name || undefined,
            }));

          console.log(
            `📍 Extracted ${locations.length} locations from direct array`
          );
        }

        console.log(
          `📍 Found ${locations.length} unique locations:`,
          locations.map((l) => l.name)
        );

        // ─── Step 4: Abhi bhi locations nahi mile toh fallback use karo ─
        if (locations.length === 0) {
          console.warn('⚠️ No locations found from API, using fallback');
          locations = getSearchFallback(params.search);
        }

        return locations;
      } catch (error) {
        console.error('❌ fetchLocations error:', error);
        throw error;
      }
    },
    [cityId]
  );

  // ─── Load Quick Locations ──────────────────────────────────────────────

  const loadQuickLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const locations = await fetchLocations({
        popular: true,
        limit: QUICK_LOCATIONS_LIMIT,
      });

      if (isMounted.current) {
        setQuickLocations(locations);
        setAllLocations(locations);
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('❌ loadQuickLocations error:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load locations'
        );
        // ✅ Fallback: Hardcoded popular locations
        setQuickLocations(FALLBACK_LOCATIONS);
        setAllLocations(FALLBACK_LOCATIONS);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [fetchLocations]);

  // ─── Search Suggestions ─────────────────────────────────────────────────

  const loadSuggestions = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm || searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setIsSearching(true);

        const locations = await fetchLocations({
          search: searchTerm,
          limit: SUGGESTIONS_LIMIT,
        });

        if (isMounted.current) {
          setSuggestions(locations);
        }
      } catch (err) {
        console.error('❌ loadSuggestions error:', err);
        if (isMounted.current) {
          // ✅ Error pe bhi search-specific fallback dikhao
          setSuggestions(getSearchFallback(searchTerm));
        }
      } finally {
        if (isMounted.current) {
          setIsSearching(false);
        }
      }
    },
    [fetchLocations]
  );

  // ─── Effects ────────────────────────────────────────────────────────────

  // Mount / Unmount
  useEffect(() => {
    isMounted.current = true;
    loadQuickLocations();

    return () => {
      isMounted.current = false;
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [loadQuickLocations]);

  // Query change -> debounced suggestions
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        loadSuggestions(query);
      }, debounceDelay);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, debounceDelay, loadSuggestions]);

  // Popup -> body scroll lock
  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPopup]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
  }, []);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    if (!newQuery) {
      setSuggestions([]);
    }
  }, []);

  const setActiveLocations = useCallback((locations: Location[]) => {
    setActiveLocationsState(locations);
  }, []);

  const toggleLocation = useCallback((location: Location) => {
    setActiveLocationsState((prev) => {
      const exists = prev.some((l) => l.id === location.id);
      return exists
        ? prev.filter((l) => l.id !== location.id)
        : [...prev, location];
    });
  }, []);

  const isLocationSelected = useCallback(
    (location: Location) => {
      return activeLocations.some((l) => l.id === location.id);
    },
    [activeLocations]
  );

  const clearAllLocations = useCallback(() => {
    setActiveLocationsState([]);
  }, []);

  const handleSearch = useCallback(async () => {
    const params: SearchParams = {
      q: query.trim(),
      type:
        activeTab === 'Rent'
          ? 'rent'
          : activeTab === 'New Homes'
          ? 'new'
          : 'buy',
      locations: selectedIds,
      city_id: cityId,
    };

    if (!params.q && params.locations.length === 0) {
      setError('Please enter a search term or select a location');
      return;
    }

    setError(null);

    if (onSearch) {
      onSearch(params);
    } else {
      const url = new URL('/search', window.location.origin);
      if (params.q) url.searchParams.set('q', params.q);
      url.searchParams.set('type', params.type);
      if (params.locations.length > 0) {
        url.searchParams.set('locations', params.locations.join(','));
      }
      if (params.city_id) {
        url.searchParams.set('city_id', String(params.city_id));
      }
      window.location.href = url.toString();
    }
  }, [query, activeTab, selectedIds, cityId, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
      if (e.key === 'Escape') {
        setSuggestions([]);
        setIsFocused(false);
      }
    },
    [handleSearch]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setError(null);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false);
      setSuggestions([]);
    }, 200);
  }, []);

  const reset = useCallback(() => {
    setQueryState('');
    setActiveLocationsState([]);
    setSuggestions([]);
    setActiveTabState(DEFAULT_TAB);
    setShowPopup(false);
    setLocationSearch('');
    setError(null);
  }, []);

  // ─── Return ─────────────────────────────────────────────────────────────

  return {
    // State
    activeTab,
    query,
    activeLocations,
    suggestions,
    quickLocations,
    allLocations,
    isLoading,
    isSearching,
    isFocused,
    showPopup,
    locationSearch,
    error,

    // Actions
    setActiveTab,
    setQuery,
    setActiveLocations,
    toggleLocation,
    isLocationSelected,
    clearAllLocations,
    setShowPopup,
    setLocationSearch,
    handleSearch,
    handleKeyDown,
    handleFocus,
    handleBlur,
    reset,
  };
}

export default useSearchBar;