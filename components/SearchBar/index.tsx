// components/SearchBar/index.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Search, MapPin, X, Check, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import type { Location, TabType } from "@/types/SearchBar";

const TABS: TabType[] = ["Buy", "Rent", "New Homes"];

const TOAST_STYLE = {
  background: "#1a1a1a",
  color: "#fff",
  fontSize: "12px",
  borderRadius: "4px",
  padding: "12px 18px",
};

interface SearchBarProps {
  className?: string;
  cityId?: number;
}

export default function SearchBar({ className = "", cityId = 71 }: SearchBarProps) {
  // ─── State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>("Buy");
  const [query, setQuery] = useState("");
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [quickLocations, setQuickLocations] = useState<Location[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVibrating, setIsVibrating] = useState(false); // ✅ Vibration state

  // ─── Refs ────────────────────────────────────────────────────────────────
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const vibrationTimeout = useRef<NodeJS.Timeout | null>(null);

  // ─── Fetch Locations ────────────────────────────────────────────────────
  const fetchLocations = useCallback(async (params: {
    search?: string;
    popular?: boolean;
    limit?: number;
  } = {}) => {
    try {
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

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch locations');

      let locations: Location[] = [];
      
      if (data.data?.properties && Array.isArray(data.data.properties)) {
        const uniqueLocations = new Map<number, Location>();
        data.data.properties.forEach((prop: any) => {
          const communityId = prop.extra?.community_id || prop.community_id;
          const communityName = prop.community_name || prop.location;
          if (communityId && communityName && !uniqueLocations.has(communityId)) {
            uniqueLocations.set(communityId, {
              id: communityId,
              name: communityName,
              slug: prop.slug || '',
              latitude: null,
              longitude: null,
              property_count: 0,
              is_popular: 0,
            });
          }
        });
        locations = Array.from(uniqueLocations.values());
      }

      if (locations.length === 0 && params.search) {
        const fallback: Location[] = [
          { id: 1125, name: 'Palm Jumeirah', slug: 'palm-jumeirah', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
          { id: 35, name: 'Dubai Hills Estate', slug: 'dubai-hills-estate', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
          { id: 2, name: 'Al Barari', slug: 'al-barari', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
          { id: 75, name: 'Sheikh Zayed Road', slug: 'sheikh-zayed-road', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
          { id: 114, name: 'Dubai Marina', slug: 'dubai-marina', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
          { id: 57, name: 'Downtown Dubai', slug: 'downtown-dubai', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
        ];
        const searchLower = params.search.toLowerCase();
        locations = fallback.filter(loc => 
          loc.name.toLowerCase().includes(searchLower)
        );
      }

      return locations;
    } catch (error) {
      console.error('❌ fetchLocations error:', error);
      throw error;
    }
  }, [cityId]);

  // ─── Load Quick Locations ──────────────────────────────────────────────
  const loadQuickLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const locations = await fetchLocations({ 
        popular: true,
        limit: 4
      });
      
      if (isMounted.current) {
        setQuickLocations(locations);
        setAllLocations(locations);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load locations');
        const fallback: Location[] = [
          { id: 1125, name: 'Palm Jumeirah', slug: 'palm-jumeirah', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
          { id: 35, name: 'Dubai Hills Estate', slug: 'dubai-hills-estate', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
          { id: 2, name: 'Al Barari', slug: 'al-barari', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
          { id: 75, name: 'Sheikh Zayed Road', slug: 'sheikh-zayed-road', latitude: null, longitude: null, property_count: 0, is_popular: 1 },
        ];
        setQuickLocations(fallback);
        setAllLocations(fallback);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [fetchLocations]);

  // ─── Load Suggestions ──────────────────────────────────────────────────
  const loadSuggestions = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setIsSearching(true);
      const locations = await fetchLocations({
        search: searchTerm,
        limit: 10,
      });
      
      if (isMounted.current) {
        setSuggestions(locations);
      }
    } catch (err) {
      if (isMounted.current) {
        setSuggestions([]);
      }
    } finally {
      if (isMounted.current) {
        setIsSearching(false);
      }
    }
  }, [fetchLocations]);

  // ─── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    loadQuickLocations();

    return () => {
      isMounted.current = false;
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (vibrationTimeout.current) clearTimeout(vibrationTimeout.current);
    };
  }, [loadQuickLocations]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        loadSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, loadSuggestions]);

  useEffect(() => {
    document.body.style.overflow = showPopup ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showPopup]);

  // ✅ Vibration effect on typing
  useEffect(() => {
    if (query.length > 0) {
      // Trigger vibration
      setIsVibrating(true);
      
      // Clear previous timeout
      if (vibrationTimeout.current) {
        clearTimeout(vibrationTimeout.current);
      }
      
      // Remove vibration after animation
      vibrationTimeout.current = setTimeout(() => {
        setIsVibrating(false);
      }, 300);
    } else {
      setIsVibrating(false);
    }

    return () => {
      if (vibrationTimeout.current) {
        clearTimeout(vibrationTimeout.current);
      }
    };
  }, [query]);

  // ─── Actions ────────────────────────────────────────────────────────────
  const toggleLocation = useCallback((location: Location) => {
    setActiveLocations(prev => {
      const exists = prev.some(l => l.id === location.id);
      return exists ? prev.filter(l => l.id !== location.id) : [...prev, location];
    });
  }, []);

  const isLocationSelected = useCallback((location: Location) => {
    return activeLocations.some(l => l.id === location.id);
  }, [activeLocations]);

  const clearAllLocations = useCallback(() => {
    setActiveLocations([]);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim() && activeLocations.length === 0) {
      setError('Please enter a search term or select a location');
      return;
    }

    setError(null);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("type", activeTab === "Rent" ? "rent" : activeTab === "New Homes" ? "new" : "buy");
    if (activeLocations.length > 0) {
      params.set("locations", activeLocations.map(l => l.id).join(","));
    }
    
    window.location.href = `/search?${params.toString()}`;
  }, [query, activeTab, activeLocations]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === "Escape") {
      setSuggestions([]);
      setIsFocused(false);
    }
  }, [handleSearch]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setError(null);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false);
      setSuggestions([]);
    }, 300);
  }, []);

  // ─── Location Popup ──────────────────────────────────────────────────────
  const LocationPopup = () => {
    const filteredLocations = allLocations.filter((loc: Location) =>
      loc.name.toLowerCase().includes(locationSearch.toLowerCase())
    );

    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => { setShowPopup(false); setLocationSearch(""); }}
      >
        <div
          className="w-full max-w-[480px] bg-white rounded-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "min(85vh, 680px)", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <MapPin size={15} className="text-white" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1a1a1a]">Select Locations</p>
                <p className="text-[11px] text-[#1a1a1a]/40">Choose areas to search in</p>
              </div>
            </div>
            <button
              onClick={() => { setShowPopup(false); setLocationSearch(""); }}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Current Location */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30">
            <button className="w-full h-10 flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-lg hover:border-[#1a1a1a] transition-colors text-[11px] font-medium tracking-[0.14em] uppercase">
              <MapPin size={14} />
              Use current location
            </button>
          </div>

          {/* Search Input */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 h-10 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-[#1a1a1a] transition-colors">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="Filter locations..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[12px] text-[#1a1a1a] placeholder:text-gray-300"
                autoFocus
              />
              {locationSearch && (
                <button onClick={() => setLocationSearch("")}>
                  <X size={12} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Selected Count */}
          {activeLocations.length > 0 && (
            <div className="px-5 py-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
              <span className="w-5 h-5 rounded-full bg-[#1a1a1a] text-white text-[9px] font-bold flex items-center justify-center">
                {activeLocations.length}
              </span>
              <span className="text-[11px] font-medium tracking-wider uppercase">
                {activeLocations.length} selected
              </span>
              <button
                onClick={clearAllLocations}
                className="ml-auto text-[10px] font-medium text-red-500 uppercase tracking-wider hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Locations List */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(85vh - 380px)" }}>
            {isLoading ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-gray-300" />
                <span className="text-[12px] text-gray-400">Loading locations...</span>
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <Search size={20} className="text-gray-200" />
                <span className="text-[12px] text-gray-400">No locations found</span>
              </div>
            ) : (
              filteredLocations.map((loc: Location) => {
                const selected = isLocationSelected(loc);
                return (
                  <button
                    key={loc.id}
                    onClick={() => toggleLocation(loc)}
                    className={`w-full flex items-center justify-between px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      selected ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          selected ? "bg-[#1a1a1a]" : "bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {selected ? <Check size={13} className="text-white" /> : <MapPin size={13} className="text-gray-400" />}
                      </div>
                      <div className="text-left">
                        <span className={`text-[12px] tracking-wider block ${selected ? "font-semibold" : ""}`}>
                          {loc.name}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                        selected ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {selected ? <Check size={12} /> : <ArrowRight size={12} />}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/80">
            <button
              onClick={() => { setShowPopup(false); setLocationSearch(""); }}
              className="flex-1 h-11 bg-white border border-gray-200 rounded-lg text-[11px] font-medium tracking-wider uppercase hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { setShowPopup(false); setLocationSearch(""); }}
              className="flex-[2] h-11 bg-[#1a1a1a] text-white rounded-lg text-[11px] font-semibold tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
            >
              <Check size={14} />
              Apply {activeLocations.length > 0 ? `(${activeLocations.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Suggestions Dropdown ──────────────────────────────────────────────
  const SuggestionsDropdown = () => {
    if (!isFocused || suggestions.length === 0) return null;

    return (
      <div
        className="absolute top-full left-0 right-12 mt-1 bg-white border border-gray-200 rounded-lg z-50 overflow-hidden"
        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
      >
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <span className="text-[9px] font-bold text-gray-400 tracking-[0.2em] uppercase">
            Popular Locations
          </span>
        </div>
        {suggestions.map((s: Location) => (
          <button
            key={s.id}
            onClick={() => {
              setQuery(s.name);
              setSuggestions([]);
              setIsFocused(false);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <MapPin size={11} className="text-gray-400" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-medium text-[#1a1a1a] block tracking-wider">
                  {s.name}
                </span>
              </div>
            </span>
            <ArrowRight size={12} className="text-gray-300" />
          </button>
        ))}
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-center" />
      {showPopup && <LocationPopup />}

      <div
        className={`w-full max-w-[960px] bg-white mx-auto rounded-xl ${className}`}
        style={{
          boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)",
        }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 sm:p-4 lg:p-5 lg:gap-6">
          {/* Left Section - Quick Locations */}
          <div className="flex flex-col flex-1 w-full lg:w-auto">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <h2 className="flex-1 text-[13px] sm:text-[14px] lg:text-[16px] text-[#1a1a1a] font-normal tracking-tight">
                Search our exclusive listings
              </h2>
              <button
                onClick={() => setShowPopup(true)}
                className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <MapPin size={15} className="text-[#1a1a1a]" />
                {activeLocations.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                    {activeLocations.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Location Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-gray-400" />
                  <span className="text-[10px] text-gray-400 tracking-wider uppercase">Loading...</span>
                </div>
              ) : (
                quickLocations.map((loc: Location) => {
                  const active = isLocationSelected(loc);
                  return (
                    <button
                      key={loc.id}
                      onClick={() => toggleLocation(loc)}
                      className={`h-6 sm:h-7 px-2.5 sm:px-3 text-[9px] sm:text-[10px] font-medium tracking-wider uppercase rounded-full border transition-colors ${
                        active
                          ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                          : "bg-gray-50 text-[#1a1a1a] border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {loc.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Section - Search Input */}
          <div className="w-full lg:w-[360px] mt-3 lg:mt-0">
            {/* Tabs */}
            <div className="flex">
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`h-7 sm:h-8 px-3 sm:px-4 text-[10px] sm:text-[11px] font-medium rounded-t-lg border border-b-0 -mb-px transition-colors ${
                      isActive
                        ? "bg-gray-50 text-[#1a1a1a] font-bold border-gray-200 z-10"
                        : "bg-transparent text-gray-400 border-transparent hover:text-[#1a1a1a]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Search Input with Vibration Effect */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div
                  className={`flex-1 flex items-center h-10 sm:h-11 lg:h-12 px-3 bg-white border rounded-lg transition-all duration-200 ${
                    isFocused ? "border-[#1a1a1a] shadow-[0_0_0_2px_rgba(26,26,26,0.06)]" : "border-gray-200"
                  } ${
                    // ✅ Vibration Animation
                    isVibrating ? "animate-[vibrate_0.2s_ease-in-out]" : ""
                  }`}
                >
                  <Search size={14} className="text-gray-400 mr-2 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="SEARCH PROPERTIES"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none text-[11px] text-[#1a1a1a] placeholder:text-gray-300 tracking-[0.15em]"
                    aria-label="Search properties"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="hover:opacity-70 transition-opacity"
                      aria-label="Clear search"
                    >
                      <X size={12} className="text-gray-400" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 hover:bg-[#1a1a1a] hover:border-[#1a1a1a] group disabled:opacity-60 shrink-0 transition-colors"
                  aria-label="Search"
                >
                  {isSearching ? (
                    <Loader2 size={16} className="animate-spin text-gray-500 group-hover:text-white" />
                  ) : (
                    <ArrowRight size={16} className="text-[#1a1a1a] group-hover:text-white transition-colors" />
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="absolute top-full left-0 right-0 mt-1 text-[10px] text-red-500">
                  {error}
                </div>
              )}

              {/* Suggestions */}
              <SuggestionsDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Add vibration keyframes to global styles */}
      <style jsx global>{`
        @keyframes vibrate {
          0% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}