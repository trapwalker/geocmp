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

			// Base layer definitions
			const baseLayers = {
				osm: {
					name: 'OSM',
					layer: L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
						attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
						maxZoom: 19
					})
				},
				satellite: {
					name: 'Satellite',
					layer: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
						attribution: '&copy; Esri',
						maxZoom: 19
					})
				},
				topo: {
					name: 'Topo',
					layer: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
						attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
						maxZoom: 17
					})
				},
				cartodb: {
					name: 'CartoDB',
					layer: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
						attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
						maxZoom: 19
					})
				}
			};

			// Create map
			const map = L.map('map', {maxZoom: 20}).setView([lat, lng], zoom);

			// State
			let currentBaseLayer = baseLayers.osm.layer;
			let isDarkBackground = false;
			currentBaseLayer.addTo(map);

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

			// Data layers state
			const layers = [];
			let currentLayerIndex = 0;
			let dataLayerOpacity = 1.0;
			const enabledLayers = new Set(layersData.map((_, i) => i)); // All enabled by default

			// Create base layer control with toggle button
			const createBaseLayerControl = () => {
				// Custom Leaflet control
				const BaseLayerControl = L.Control.extend({
					options: {
						position: 'topleft'
					},

					onAdd: function(map) {
						const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
						const button = L.DomUtil.create('a', 'leaflet-control-settings', container);
						button.innerHTML = '⚙';
						button.href = '#';
						button.title = 'Base layer settings';

						// Prevent map dragging when clicking control
						L.DomEvent.disableClickPropagation(container);
						L.DomEvent.disableScrollPropagation(container);

						// Toggle settings panel
						L.DomEvent.on(button, 'click', function(e) {
							L.DomEvent.preventDefault(e);
							const panel = document.getElementById('base-layer-control');
							panel.classList.toggle('visible');
						});

						return container;
					}
				});

				map.addControl(new BaseLayerControl());

				// Create settings panel
				const panel = document.getElementById('base-layer-control');

				// Title
				const title = document.createElement('div');
				title.className = 'control-title';
				title.textContent = 'Base Layer';
				panel.appendChild(title);

				// Base layer selector
				const layerSelector = document.createElement('select');
				layerSelector.className = 'base-layer-select';
				Object.entries(baseLayers).forEach(([key, {name}]) => {
					const option = document.createElement('option');
					option.value = key;
					option.textContent = name;
					if (key === 'osm') option.selected = true;
					layerSelector.appendChild(option);
				});

				layerSelector.addEventListener('change', (e) => {
					map.removeLayer(currentBaseLayer);
					currentBaseLayer = baseLayers[e.target.value].layer;
					currentBaseLayer.addTo(map);
				});
				panel.appendChild(layerSelector);

				// Opacity control
				const opacityLabel = document.createElement('label');
				opacityLabel.className = 'control-label';
				opacityLabel.textContent = 'Opacity:';
				panel.appendChild(opacityLabel);

				const opacitySlider = document.createElement('input');
				opacitySlider.type = 'range';
				opacitySlider.className = 'opacity-slider';
				opacitySlider.min = '0';
				opacitySlider.max = '100';
				opacitySlider.value = '100';
				opacitySlider.addEventListener('input', (e) => {
					currentBaseLayer.setOpacity(e.target.value / 100);
				});
				panel.appendChild(opacitySlider);

				// Data layer opacity control
				const dataOpacityLabel = document.createElement('label');
				dataOpacityLabel.className = 'control-label';
				dataOpacityLabel.textContent = 'Data Opacity:';
				panel.appendChild(dataOpacityLabel);

				const dataOpacitySlider = document.createElement('input');
				dataOpacitySlider.type = 'range';
				dataOpacitySlider.className = 'opacity-slider';
				dataOpacitySlider.min = '0';
				dataOpacitySlider.max = '100';
				dataOpacitySlider.value = '100';
				dataOpacitySlider.addEventListener('input', (e) => {
					dataLayerOpacity = e.target.value / 100;
					updateDataLayerOpacity();
				});
				panel.appendChild(dataOpacitySlider);

				// Background toggle
				const bgToggle = document.createElement('button');
				bgToggle.className = 'bg-toggle';
				bgToggle.textContent = '☀ Light';
				bgToggle.addEventListener('click', () => {
					isDarkBackground = !isDarkBackground;
					const mapContainer = document.getElementById('map');
					if (isDarkBackground) {
						mapContainer.style.backgroundColor = '#2d2d2d';
						bgToggle.textContent = '🌙 Dark';
					} else {
						mapContainer.style.backgroundColor = '#e0e0e0';
						bgToggle.textContent = '☀ Light';
					}
				});
				panel.appendChild(bgToggle);

				// Close panel when clicking outside
				document.addEventListener('click', (e) => {
					if (!panel.contains(e.target) && !e.target.closest('.leaflet-control-settings')) {
						panel.classList.remove('visible');
					}
				});
			};

			// Create layer selector widget with checkboxes
			const createLayerSelector = () => {
				const container = document.getElementById('tabs');

				// Title
				const title = document.createElement('div');
				title.className = 'control-title';
				title.textContent = 'Data Layers';
				container.appendChild(title);

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
				updateDataLayerOpacity();
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

			// Update data layer opacity
			const updateDataLayerOpacity = () => {
				const currentLayer = layers[currentLayerIndex];
				if (!currentLayer) return;

				currentLayer.eachLayer((layer) => {
					if (layer.setStyle) {
						// Store original opacity values if not already stored
						if (!layer._originalOpacity) {
							layer._originalOpacity = layer.options.opacity || 0.8;
							layer._originalFillOpacity = layer.options.fillOpacity || 0.5;
						}

						// Apply opacity multiplier to original values
						layer.setStyle({
							opacity: layer._originalOpacity * dataLayerOpacity,
							fillOpacity: layer._originalFillOpacity * dataLayerOpacity
						});
					}
				});
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
			createBaseLayerControl();
			createLayerSelector();
		}
