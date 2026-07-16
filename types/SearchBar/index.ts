// types/SearchBar.ts

export interface Location {
  id: number;
  name: string;
  slug: string;
  latitude: string | null;
  longitude: string | null;
  property_count: number;
  is_popular: number;
  city_id?: number;
  city_name?: string;
}

export interface SearchBarProps {
  initialTab?: TabType;
  initialQuery?: string;
  initialLocations?: Location[];
  cityId?: number;
  onSearch?: (params: SearchParams) => void;
  className?: string;
}

export interface SearchParams {
  q: string;
  type: 'buy' | 'rent' | 'new';
  locations: number[];
  city_id?: number;
  page?: number;
  limit?: number;
}

export type TabType = 'Buy' | 'Rent' | 'New Homes';

export interface SearchBarState {
  activeTab: TabType;
  query: string;
  activeLocations: Location[];
  suggestions: Location[];
  quickLocations: Location[];
  allLocations: Location[];
  isLoading: boolean;
  isSearching: boolean;
  isFocused: boolean;
  showPopup: boolean;
  locationSearch: string;
  error: string | null;
}

export interface SearchBarActions {
  setActiveTab: (tab: TabType) => void;
  setQuery: (query: string) => void;
  setActiveLocations: (locations: Location[]) => void;
  toggleLocation: (location: Location) => void;
  isLocationSelected: (location: Location) => boolean;
  clearAllLocations: () => void;
  setShowPopup: (show: boolean) => void;
  setLocationSearch: (search: string) => void;
  handleSearch: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleFocus: () => void;
  handleBlur: () => void;
  reset: () => void;
}

export type UseSearchBarReturn = SearchBarState & SearchBarActions;