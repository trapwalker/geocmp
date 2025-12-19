		// Initialize map with layer switching functionality
		function initMapWithLayers(layersData) {
			// Parse coordinates from URL hash
			const parseUrlParams = () => {
				const params = new URLSearchParams(window.location.hash.substring(1));
				return {
					lat: parseFloat(params.get('lat')) || 55.75,
					lng: parseFloat(params.get('lng')) || 37.6,
					zoom: parseInt(params.get('zoom')) || 10
				};
			};

			const {lat, lng, zoom} = parseUrlParams();

			// Create map with OSM tiles
			const map = L.map('map', {maxZoom: 20}).setView([lat, lng], zoom);
			L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);

			// Create marker pane (above polygons)
			try {
				map.createPane('markerPane');
				map.getPane('markerPane').style.zIndex = 650;
			} catch (e) { /* ignore if exists */ }

			// Update URL on map movement
			const updateUrlCoordinates = () => {
				const center = map.getCenter();
				const z = map.getZoom();
				window.history.replaceState(null, null,
					`#lat=${center.lat.toFixed(5)}&lng=${center.lng.toFixed(5)}&zoom=${z}`);
			};

			map.on('moveend', updateUrlCoordinates);
			map.on('zoomend', updateUrlCoordinates);

			// State
			const layers = [];
			let currentLayerIndex = 0;
			const enabledLayers = new Set(layersData.map((_, i) => i)); // All enabled by default

			// Create layer selector widget with checkboxes
			const createLayerSelector = () => {
				const container = document.getElementById('tabs');
				const list = document.createElement('div');
				list.className = 'layer-list';

				layersData.forEach((layerInfo, index) => {
					const item = document.createElement('label');
					item.className = 'layer-item';
					if (index === 0) item.classList.add('active');

					// Hotkey number (1-9, 0 for 10th)
					const hotkey = index < 9 ? index + 1 : (index === 9 ? 0 : '');
					const hotkeySpan = document.createElement('span');
					hotkeySpan.className = 'layer-hotkey';
					hotkeySpan.textContent = hotkey;

					// Checkbox
					const checkbox = document.createElement('input');
					checkbox.type = 'checkbox';
					checkbox.checked = true;
					checkbox.addEventListener('change', (e) => {
						if (e.target.checked) {
							enabledLayers.add(index);
						} else {
							enabledLayers.delete(index);
							// Switch to next enabled layer if current is disabled
							if (index === currentLayerIndex && enabledLayers.size > 0) {
								switchToNextLayer();
							}
						}
					});

					// Layer name
					const nameSpan = document.createElement('span');
					nameSpan.className = 'layer-name';
					nameSpan.textContent = layerInfo.name;

					// Click on item switches to layer
					item.addEventListener('click', (e) => {
						if (e.target !== checkbox) {
							switchLayer(index);
						}
					});

					item.appendChild(hotkeySpan);
					item.appendChild(checkbox);
					item.appendChild(nameSpan);
					list.appendChild(item);
				});

				container.appendChild(list);
			};

			// Switch to specific layer
			const switchLayer = (index) => {
				if (index < 0 || index >= layers.length || !layers[index]) return;

				// Hide all layers
				layers.forEach(layer => layer && map.removeLayer(layer));

				// Show selected layer
				map.addLayer(layers[index]);

				// Update active state in UI
				document.querySelectorAll('.layer-item').forEach((item, i) => {
					item.classList.toggle('active', i === index);
				});

				currentLayerIndex = index;
				updateInfo(index);
			};

			// Switch to next enabled layer (cycle)
			const switchToNextLayer = () => {
				if (enabledLayers.size === 0) return;

				let nextIndex = (currentLayerIndex + 1) % layers.length;
				let attempts = 0;

				while (!enabledLayers.has(nextIndex) && attempts < layers.length) {
					nextIndex = (nextIndex + 1) % layers.length;
					attempts++;
				}

				if (enabledLayers.has(nextIndex) && layers[nextIndex]) {
					switchLayer(nextIndex);
				}
			};

			// Update layer info display
			const updateInfo = (index) => {
				const infoDiv = document.getElementById('info');
				if (!infoDiv || index < 0 || index >= layersData.length) return;

				const layerInfo = layersData[index];
				infoDiv.innerHTML = `
					<strong>${layerInfo.name}</strong><br>
					Источник: ${layerInfo.source}<br>
					Объектов: ${layerInfo.features || 0}
				`;
			};

			// Extract style properties from feature
			const getFeatureStyle = (feature) => {
				if (feature.style) return feature.style;

				const props = feature.properties || {};
				const getProperty = (...keys) => {
					for (const key of keys) {
						if (props[key] !== undefined) return props[key];
					}
					return null;
				};

				const stroke = getProperty('stroke', 'stroke-color', 'strokeColor', 'color', 'marker-color') || '#3388ff';
				const fill = getProperty('fill', 'fill-color', 'fillColor', 'marker-color') || stroke;
				const fillOpacity = parseFloat(getProperty('fill-opacity', 'fillOpacity')) || 0.5;
				const weight = parseFloat(getProperty('stroke-width', 'strokeWidth')) || 2;

				return {
					color: stroke,
					weight: isNaN(weight) ? 2 : weight,
					opacity: 0.8,
					fillColor: fill,
					fillOpacity: isNaN(fillOpacity) ? 0.5 : fillOpacity
				};
			};

			// Create point marker with custom style
			const createPointMarker = (feature, latlng) => {
				const props = feature.properties || {};
				const getProperty = (...keys) => {
					for (const key of keys) {
						if (props[key] !== undefined) return props[key];
					}
					return null;
				};

				const color = getProperty('marker-color', 'markerColor', 'stroke', 'stroke-color', 'color') || '#3388ff';
				const fillColor = getProperty('fill', 'fill-color', 'fillColor') || color;

				let radius = 6;
				const markerSize = props['marker-size'];
				if (markerSize === 'large') radius = 12;
				else if (markerSize === 'small') radius = 4;
				else if (props.radius) radius = parseFloat(props.radius) || 6;

				const weight = parseFloat(getProperty('stroke-width', 'strokeWidth')) || 1;
				const fillOpacity = parseFloat(getProperty('fill-opacity', 'fillOpacity')) || 0.9;

				return L.circleMarker(latlng, {
					radius,
					color,
					fillColor,
					pane: 'markerPane',
					weight: isNaN(weight) ? 1 : weight,
					fillOpacity: isNaN(fillOpacity) ? 0.9 : fillOpacity
				});
			};

			// Create popup content from properties
			const createPopup = (properties) => {
				const rows = Object.entries(properties)
					.map(([key, value]) => `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`)
					.join('');
				return `<table class="simple-table">${rows}</table>`;
			};

			// Load all layers
			layersData.forEach((layerInfo, index) => {
				try {
					const geojson = L.geoJson(layerInfo.data, {
						pointToLayer: createPointMarker,
						style: getFeatureStyle,
						onEachFeature: (feature, layer) => {
							layer.bindPopup(createPopup(feature.properties));
						}
					});

					layers[index] = geojson;

					// Fit map to first layer bounds
					if (index === 0 && geojson.getBounds && geojson.getBounds().isValid()) {
						map.fitBounds(geojson.getBounds(), {padding: [20, 20]});
						switchLayer(0);
					}
				} catch (e) {
					console.error('Failed to load layer:', layerInfo.name, e);
					layers[index] = null;
				}
			});

			// Keyboard shortcuts
			document.addEventListener('keydown', (event) => {
				const key = event.key;

				// Numbers 1-9, 0 for 10th layer
				if (key >= '0' && key <= '9') {
					const layerIndex = key === '0' ? 9 : parseInt(key) - 1;
					if (layerIndex < layers.length && layers[layerIndex]) {
						switchLayer(layerIndex);
					}
				}
				// T, E (Russian), or Space to cycle through enabled layers
				else if (key === 't' || key === 'T' || key === 'е' || key === 'Е' || key === ' ') {
					event.preventDefault(); // Prevent space from scrolling page
					switchToNextLayer();
				}
			});

			// Initialize UI
			createLayerSelector();
		}
