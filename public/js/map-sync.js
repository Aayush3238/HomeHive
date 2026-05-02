(function () {
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delay);
    };
  };

  const splitDisplayName = (displayName) =>
    (displayName || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

  const normalizeAddressParts = (data) => {
    const address = data.address || {};
    const displayParts = splitDisplayName(data.display_name);
    const city = address.city
      || address.town
      || address.village
      || address.hamlet
      || address.municipality
      || address.suburb
      || address.neighbourhood
      || displayParts[displayParts.length - 4]
      || '';
    const district = address.state_district
      || address.county
      || address.district
      || address.region
      || displayParts[displayParts.length - 3]
      || '';
    const state = address.state
      || address.province
      || address.region
      || displayParts[displayParts.length - 2]
      || '';
    const country = address.country
      || displayParts[displayParts.length - 1]
      || '';
    const houseNo = address.house_number || address.building || address.premise || '';

    return {
      houseNo,
      city,
      district,
      state,
      country,
      formattedAddress: data.display_name
        || [houseNo, city, district, state, country].filter(Boolean).join(', '),
    };
  };

  window.initAddressMapSync = function initAddressMapSync(config) {
    const mapElement = document.getElementById(config.mapId);
    if (!mapElement || typeof L === 'undefined') {
      return;
    }

    const addressInput = document.getElementById(config.addressInputId);
    const latInput = document.getElementById(config.latInputId);
    const lngInput = document.getElementById(config.lngInputId);
    const suggestionList = document.getElementById(config.suggestionListId);
    const statusElement = config.statusId ? document.getElementById(config.statusId) : null;
    const latPreview = document.getElementById('latPreview');
    const lngPreview = document.getElementById('lngPreview');
    const fields = {
      houseNo: document.querySelector('input[name="houseNo"]'),
      city: document.querySelector('input[name="city"]'),
      district: document.querySelector('input[name="district"]'),
      state: document.querySelector('input[name="state"]'),
      country: document.querySelector('input[name="country"]'),
    };

    const map = L.map(config.mapId, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView(defaultCenter, defaultZoom);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker(defaultCenter, {
      draggable: true,
      autoPan: true,
    }).addTo(map);

    let selectedAddress = '';
    let activeRequest = 0;
    let activeReverseRequest = 0;
    let suppressSearchInput = false;

    const setStatus = (message, state) => {
      if (!statusElement) {
        return;
      }

      statusElement.textContent = message;
      statusElement.classList.remove('is-loading', 'is-success', 'is-error');
      if (state) {
        statusElement.classList.add(state);
      }
    };

    const updateInputValue = (input, value) => {
      if (!input) {
        return;
      }

      input.value = value || '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const showSuggestions = (results) => {
      if (!suggestionList) {
        return;
      }

      suggestionList.innerHTML = '';
      if (!results.length) {
        suggestionList.hidden = true;
        return;
      }

      results.forEach((result) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'autocomplete-item';
        button.textContent = result.display_name;
        button.addEventListener('click', () => {
          suggestionList.hidden = true;
          applyLocation(result, true);
        });
        suggestionList.appendChild(button);
      });

      suggestionList.hidden = false;
    };

    const updateCoordinateFields = (lat, lng) => {
      latInput.value = lat.toFixed(6);
      lngInput.value = lng.toFixed(6);
      if (latPreview) {
        latPreview.value = latInput.value;
      }
      if (lngPreview) {
        lngPreview.value = lngInput.value;
      }
    };

    const updateAddressFields = (locationData) => {
      const parts = normalizeAddressParts(locationData);
      suppressSearchInput = true;
      addressInput.value = parts.formattedAddress;
      selectedAddress = parts.formattedAddress;
      window.setTimeout(() => {
        suppressSearchInput = false;
      }, 0);

      Object.entries(fields).forEach(([key, input]) => {
        updateInputValue(input, parts[key]);
      });

      setStatus('Address details synced with the form.', 'is-success');
    };

    const moveMarker = (lat, lng, zoomLevel) => {
      marker.setLatLng([lat, lng]);
      map.flyTo([lat, lng], zoomLevel || 15, {
        animate: true,
        duration: 1.2,
      });
    };

    const reverseGeocode = async (lat, lng) => {
      const requestId = ++activeReverseRequest;
      updateCoordinateFields(lat, lng);
      setStatus('Fetching address details from the selected map point...', 'is-loading');

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`, {
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          if (requestId === activeReverseRequest) {
            setStatus('Could not fetch address details for that point. Try another nearby point.', 'is-error');
          }
          return;
        }

        const result = await response.json();
        if (requestId !== activeReverseRequest) {
          return;
        }

        updateAddressFields(result);
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        if (requestId === activeReverseRequest) {
          setStatus('Reverse geocoding failed. Check your connection and try again.', 'is-error');
        }
      }
    };

    const applyLocation = (locationData, fromSearch) => {
      const lat = Number(locationData.lat);
      const lng = Number(locationData.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      moveMarker(lat, lng, fromSearch ? 16 : 15);
      updateCoordinateFields(lat, lng);
      updateAddressFields(locationData);
      showSuggestions([]);
    };

    const geocodeAddress = debounce(async (query) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 3) {
        showSuggestions([]);
        setStatus('Type at least 3 characters to search for an address.', '');
        return;
      }

      const requestId = ++activeRequest;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(trimmedQuery)}`, {
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          showSuggestions([]);
          setStatus('Address search is unavailable right now. Try again in a moment.', 'is-error');
          return;
        }

        const results = await response.json();
        if (requestId !== activeRequest) {
          return;
        }

        showSuggestions(results);
        if (!results.length) {
          setStatus('No matching places found. Try a broader landmark or locality.', 'is-error');
          return;
        }

        setStatus('Choose a suggestion or keep typing to refine the address.', 'is-success');
        if (results[0] && trimmedQuery.length > 6) {
          applyLocation(results[0], true);
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
        showSuggestions([]);
        setStatus('Search failed. Check your connection and try again.', 'is-error');
      }
    }, 400);

    addressInput.addEventListener('input', (event) => {
      if (suppressSearchInput) {
        return;
      }

      setStatus('Searching matching places...', 'is-loading');
      geocodeAddress(event.target.value);
    });

    addressInput.addEventListener('focus', () => {
      if (suggestionList && suggestionList.children.length > 0) {
        suggestionList.hidden = false;
      }
    });

    document.addEventListener('click', (event) => {
      if (!suggestionList) {
        return;
      }

      if (event.target !== addressInput && !suggestionList.contains(event.target)) {
        suggestionList.hidden = true;
      }
    });

    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      reverseGeocode(lat, lng);
    });

    map.on('click', (event) => {
      const { lat, lng } = event.latlng;
      marker.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    });

    if (navigator.geolocation && config.useCurrentLocationButtonId) {
      const locationButton = document.getElementById(config.useCurrentLocationButtonId);
      if (locationButton) {
        locationButton.addEventListener('click', () => {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            moveMarker(latitude, longitude, 16);
            reverseGeocode(latitude, longitude);
          }, () => {
            setStatus('Could not access your current location.', 'is-error');
          });
        });
      }
    }

    const initialLat = Number(latInput.value);
    const initialLng = Number(lngInput.value);

    if (Number.isFinite(initialLat) && Number.isFinite(initialLng) && initialLat && initialLng) {
      moveMarker(initialLat, initialLng, 14);
      reverseGeocode(initialLat, initialLng);
    } else {
      updateCoordinateFields(defaultCenter[0], defaultCenter[1]);
      marker.setLatLng(defaultCenter);
      setStatus('Search a place, choose a suggestion, or click the map to auto-fill the form.', '');
    }

    if (config.initialAddress && !selectedAddress) {
      addressInput.value = config.initialAddress;
      geocodeAddress(config.initialAddress);
    }
  };
}());
