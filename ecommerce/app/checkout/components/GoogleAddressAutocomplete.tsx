"use client";

/**
 * GoogleAddressAutocomplete Component
 * 
 * Required Google Cloud API (enable in Google Cloud Console):
 * - Places API (New) - This single API includes:
 *   1. Autocomplete suggestions (places:autocomplete endpoint)
 *   2. Place Details (places/{placeId} endpoint)
 * 
 * Note: Place Details is NOT a separate API. It's part of Places API (New).
 * You only need to enable "Places API (New)" in Google Cloud Console.
 * 
 * Make sure:
 * - Places API (New) is enabled in your Google Cloud project
 * - API key has permissions for Places API (New)
 * - Billing is enabled for the project
 * - API key restrictions allow your domain
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/app/components/ui/input';
import { Home, MapPin } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (address: string, components?: {
    city?: string;
    district?: string;
    khoroo?: string;
    address?: string;
  }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const GoogleAddressAutocomplete = ({
  value,
  onChange,
  placeholder = "Хаяг оруулж захиалга эхлүүлэх. Жич: Та сайтар шалгаж зөв хаяг оруулна уу",
  className = "",
  disabled = false,
}: GoogleAddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use environment variable if available
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyALLMawRMY956_UC1A2WYfmDmeSdxsOtPk';

  // Fetch autocomplete suggestions using Places API (New)
  const fetchAutocompleteSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!API_KEY || API_KEY === '') {
      console.warn('Google Maps API key is not configured');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
          },
          body: JSON.stringify({
            input: input,
            languageCode: 'mn',
            regionCode: 'mn',
            includedRegionCodes: ['mn'],
            includedPrimaryTypes: [
              'street_address', 
              'premise', 
              'subpremise',
              'establishment',
              'point_of_interest'
            ],
          }),
        }
      );

      if (!response.ok) {
        // Log the actual status code first
        console.error(`Google Places API (New) Autocomplete error - Status: ${response.status} ${response.statusText}`);
        
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
          console.error('Google Places API (New) Autocomplete error data:', errorData);
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
          console.error('Could not parse error response as JSON:', e);
        }
        
        // Check for 403 status regardless of JSON parsing success
        if (response.status === 403) {
          console.error('Google Places API (New) 403 Forbidden. Please check:');
          console.error('1. Places API (New) is enabled in Google Cloud Console');
          console.error('2. API key has correct permissions');
          console.error('3. Billing is enabled for the project');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const predictions = data.suggestions?.map((suggestion: any) => 
        suggestion.placePrediction
      ).filter(Boolean) || [];
      
      // Debug: log predictions to see structure
      if (predictions.length > 0) {
        console.log('Autocomplete predictions:', predictions);
      }
      
      setSuggestions(predictions);
      setShowSuggestions(predictions.length > 0);
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [API_KEY]);

  // Fetch place details using Places API (New)
  const fetchPlaceDetails = useCallback(async (placeId: string) => {
    if (!API_KEY || API_KEY === '') {
      console.warn('Google Maps API key is not configured');
      return null;
    }

    if (!placeId) {
      console.warn('No placeId provided');
      return null;
    }

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,addressComponents,location',
          },
        }
      );

      if (!response.ok) {
        // Log the actual status code first
        console.error(`Google Places API (New) Place Details error - Status: ${response.status} ${response.statusText}`);
        
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
          console.error('Google Places API (New) Place Details error data:', errorData);
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
          console.error('Could not parse error response as JSON:', e);
        }
        
        // Check for 403 status regardless of JSON parsing success
        if (response.status === 403) {
          console.error('Google Places API (New) Place Details 403 Forbidden. Please check:');
          console.error('1. Places API (New) is enabled in Google Cloud Console');
          console.error('   (Note: Place Details is part of Places API New, not a separate API)');
          console.error('2. API key has correct permissions for Places API (New)');
          console.error('3. Billing is enabled for the project');
          console.error('4. API key restrictions allow your domain');
        }
        
        throw new Error(errorMessage);
      }

      const place = await response.json();
      console.log('Place details fetched successfully:', place);
      return place;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }, [API_KEY]);

  // Handle input changes with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce API calls
    debounceTimerRef.current = setTimeout(() => {
      fetchAutocompleteSuggestions(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);
    
    // Extract placeId - handle both direct placeId and nested structure
    const placeId = suggestion.placeId || suggestion.placePrediction?.placeId;
    
    if (!placeId) {
      console.error('No placeId found in suggestion:', suggestion);
      // Fallback to suggestion text if no placeId
      const addressText = suggestion.text?.text || suggestion.structuredFormat?.mainText?.text || suggestion.text || '';
      onChange(addressText, {
        address: addressText,
      });
      setIsLoading(false);
      return;
    }
    
    console.log('Fetching place details for placeId:', placeId);
    
    // Get full place details
    const place = await fetchPlaceDetails(placeId);
    
    if (!place) {
      console.warn('Failed to fetch place details, using suggestion text');
      // Fallback to suggestion text if place details fail
      const addressText = suggestion.text?.text || suggestion.structuredFormat?.mainText?.text || suggestion.text || '';
      onChange(addressText, {
        address: addressText,
      });
      setIsLoading(false);
      return;
    }

    // Parse address components for Mongolia
    let city = '';
    let district = '';
    let khoroo = '';
    let streetAddress = '';
    let streetNumber = '';
    let premise = '';

    place.addressComponents?.forEach((component: any) => {
      const types = component.types || [];

      // City (locality or administrative_area_level_1)
      if (types.includes('locality')) {
        city = component.longText || component.text || '';
      } else if (types.includes('administrative_area_level_1') && !city) {
        city = component.longText || component.text || '';
      }

      // District (sublocality_level_1 or administrative_area_level_2)
      if (types.includes('sublocality_level_1')) {
        district = component.longText || component.text || '';
      } else if (types.includes('administrative_area_level_2') && !district) {
        district = component.longText || component.text || '';
      }

      // Khoroo (sublocality_level_2 or sublocality)
      if (types.includes('sublocality_level_2')) {
        khoroo = component.longText || component.text || '';
      } else if (types.includes('sublocality') && !khoroo) {
        const name = component.longText || component.text || '';
        if (/\d/.test(name)) {
          khoroo = name;
        }
      }

      // Street name
      if (types.includes('route')) {
        streetAddress = component.longText || component.text || '';
      }

      // Street number
      if (types.includes('street_number')) {
        streetNumber = component.longText || component.text || '';
      }

      // Building/premise
      if (types.includes('premise') || types.includes('subpremise')) {
        premise = component.longText || component.text || '';
      }
    });

    // Get the suggestion text (this is what the user selected, e.g., "нарны хороолол 7р байр")
    const suggestionText = suggestion.text?.text || suggestion.structuredFormat?.mainText?.text || '';
    
    // Build full address from components if available
    const addressParts = [];
    if (streetNumber) addressParts.push(streetNumber);
    if (streetAddress) addressParts.push(streetAddress);
    if (premise) addressParts.push(premise);
    
    // Check if place.formattedAddress is a Plus Code (format: XX##+XXX)
    const isPlusCode = place.formattedAddress && /^[A-Z0-9]{2,3}\+[A-Z0-9]{2,3}/.test(place.formattedAddress);
    
    // Priority: 1) suggestion text (what user selected), 2) built address parts, 3) formattedAddress (if not Plus Code)
    let fullAddress = '';
    if (suggestionText) {
      // Use the suggestion text as primary source (e.g., "нарны хороолол 7р байр")
      fullAddress = suggestionText;
    } else if (addressParts.length > 0) {
      fullAddress = addressParts.join(' ');
    } else if (place.formattedAddress && !isPlusCode) {
      fullAddress = place.formattedAddress;
    } else {
      // Last resort: use displayName or any available text
      fullAddress = place.displayName?.text || place.formattedAddress || '';
    }

    // Call onChange with full address and parsed components
    onChange(fullAddress, {
      city: city || undefined,
      district: district || undefined,
      khoroo: khoroo || undefined,
      address: fullAddress,
    });

    setIsLoading(false);
  };

  // Handle "Find Location" button click
  const handleFindLocation = () => {
    if (value && value.length >= 2) {
      fetchAutocompleteSuggestions(value);
      setShowSuggestions(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && value && value.length >= 2) {
        handleFindLocation();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (suggestions.length > 0) {
          handleSelectSuggestion(suggestions[0]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target)
      ) {
        setShowSuggestions(false);
      }
    };

    // Use a slight delay to allow click events on suggestions to fire first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            className={`pl-10 ${className}`}
            disabled={disabled}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={handleFindLocation}
          disabled={disabled || !value || value.length < 2}
          className="bg-red-600 hover:bg-red-700 text-white px-4"
        >
          <MapPin className="h-4 w-4 mr-1" />
          Байршил олох
        </Button>
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          onMouseDown={(e) => e.preventDefault()} // Prevent input blur
        >
          {suggestions.map((suggestion: any, index: number) => (
            <div
              key={suggestion.placeId || index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectSuggestion(suggestion, e);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-start gap-2 ${
                index === selectedIndex ? 'bg-gray-50' : ''
              }`}
            >
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.text?.text || suggestion.structuredFormat?.mainText?.text}
                </div>
                {suggestion.structuredFormat?.secondaryText?.text && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {suggestion.structuredFormat.secondaryText.text}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="absolute bottom-0 right-0 text-xs text-gray-400 pr-2 pb-1">
        powered by Google
      </div>
    </div>
  );
};

export default GoogleAddressAutocomplete;
