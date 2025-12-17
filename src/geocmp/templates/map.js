		// Функция инициализации карты с переключением слоев
		function initMapWithLayers(layersData) {
			// Парсим координаты из URL
			const params = new URLSearchParams(window.location.hash.substring(1));
			const lat = parseFloat(params.get('lat')) || 55.75;
			const lng = parseFloat(params.get('lng')) || 37.6;
			const zoom = parseInt(params.get('zoom')) || 10;

			// Создаем карту
			let map = L.map('map', {maxZoom: 20}).setView([lat, lng], zoom);

			// Добавляем слой OSM
			L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(map);

			// Создаем отдельную панель для маркеров, чтобы они были поверх залитых полигонов
			try {
				map.createPane('markerPane');
				map.getPane('markerPane').style.zIndex = 650; // выше, чем pane векторных слоев
			} catch (e) {
				// ignore if pane exists or create fails
			}

			// Массив для хранения слоев
			let layers = [];
			let currentLayerIndex = 0;
			let tabsContainer = document.getElementById('tabs');

			// Обновляем URL при движении карты
			function updateUrlCoordinates() {
				const center = map.getCenter();
				const z = map.getZoom();
				const newHash = `#lat=${center.lat.toFixed(5)}&lng=${center.lng.toFixed(5)}&zoom=${z}`;
				window.history.replaceState(null, null, newHash);
			}

			map.on('moveend', updateUrlCoordinates);
			map.on('zoomend', updateUrlCoordinates);

			// Создаем вкладки для всех слоев
			function createTabs() {
				layersData.forEach(function(layerInfo, index) {
					var tab = document.createElement('div');
					tab.className = 'tab' + (index === 0 ? ' active' : '');
					tab.textContent = layerInfo.name;
					tab.setAttribute('data-layer', index);
					tab.addEventListener('click', function() {
						switchLayer(index);
					});
					tabsContainer.appendChild(tab);
				});
			}

			// Функция переключения слоя
			function switchLayer(index) {
				if (index < 0 || index >= layers.length || !layers[index]) {
					return;
				}

				// Скрываем все слои
				layers.forEach(function(layer) {
					if (layer) {
						map.removeLayer(layer);
					}
				});

				// Показываем выбранный слой
				map.addLayer(layers[index]);

				// Обновляем активную вкладку
				document.querySelectorAll('.tab').forEach(function(tab, i) {
					if (i === index) {
						tab.classList.add('active');
					} else {
						tab.classList.remove('active');
					}
				});

				// Обновляем инфо
				updateInfo(index);
				currentLayerIndex = index;
			}

			// Функция циклического переключения слоев
			function switchToNextLayer() {
				var nextIndex = (currentLayerIndex + 1) % layers.length;
				// Пропускаем незагруженные слои
				for (var i = 0; i < layers.length; i++) {
					if (layers[nextIndex]) {
						switchLayer(nextIndex);
						return;
					}
					nextIndex = (nextIndex + 1) % layers.length;
				}
			}

			// Обновляем информацию о слое
			function updateInfo(index) {
				if (index < 0 || index >= layersData.length) return;
				const infoDiv = document.getElementById('info');
				if (infoDiv) {
					const layerInfo = layersData[index];
					infoDiv.innerHTML = '<strong>' + layerInfo.name + '</strong><br>' +
						'Источник: ' + layerInfo.source + '<br>' +
						'Объектов: ' + (layerInfo.features || 0);
				}
			}

			// Загружаем все слои
			layersData.forEach(function(layerInfo, index) {
				try {
					// Подсчитаем ожидаемое число архитектурных форм типа Point в данных (для отладки)
					var expectedArchPoints = 0;
					try {
						if (layerInfo && layerInfo.data && layerInfo.data.features) {
							layerInfo.data.features.forEach(function(f) {
								if (f && f.properties && f.properties.type === 'architecture_form' && f.geometry && f.geometry.type === 'Point') expectedArchPoints++;
							});
						}
					} catch (e) { /* ignore */ }
					var geojson = L.geoJson(layerInfo.data, {
						// Для точек используем circleMarker, чтобы можно было менять цвет
						pointToLayer: function(feature, latlng) {
							var props = feature.properties || {};
							var color = props['marker-color'] || props['markerColor'] || props['stroke'] || props['stroke-color'] || props['color'] || '#3388ff';
							var fillColor = props['fill'] || props['fill-color'] || props['fillColor'] || color;
							var radius = 6;
							if (props['marker-size']) {
								if (props['marker-size'] === 'large') radius = 12;
								else if (props['marker-size'] === 'small') radius = 4;
							} else if (props['radius']) {
								var r = parseFloat(props['radius']);
								if (!isNaN(r)) radius = r;
							}
							var weight = (props['stroke-width'] !== undefined) ? parseFloat(props['stroke-width']) : ((props['strokeWidth'] !== undefined) ? parseFloat(props['strokeWidth']) : 1);
							var fillOpacity = (props['fill-opacity'] !== undefined) ? parseFloat(props['fill-opacity']) : ((props['fillOpacity'] !== undefined) ? parseFloat(props['fillOpacity']) : 0.9);
							return L.circleMarker(latlng, {
								radius: radius,
								color: color,
								fillColor: fillColor,
								pane: 'markerPane',
								weight: isNaN(weight) ? 1 : weight,
								fillOpacity: isNaN(fillOpacity) ? 0.9 : fillOpacity
							});
						},
						style: function(feature) {
							// Используем встроенные стили из feature, если есть
							if (feature.style) {
								return feature.style;
							}
							// Попробуем вывести стили из свойств (marker-color, fill, stroke, fill-opacity, stroke-width)
							var props = feature.properties || {};
							var stroke = props['stroke'] || props['stroke-color'] || props['strokeColor'] || props['color'] || props['marker-color'] || '#3388ff';
							var fill = props['fill'] || props['fill-color'] || props['fillColor'] || props['marker-color'] || stroke;
							var fillOpacity = (props['fill-opacity'] !== undefined) ? parseFloat(props['fill-opacity']) : ((props['fillOpacity'] !== undefined) ? parseFloat(props['fillOpacity']) : 0.5);
							var weight = (props['stroke-width'] !== undefined) ? parseFloat(props['stroke-width']) : ((props['strokeWidth'] !== undefined) ? parseFloat(props['strokeWidth']) : 2);
							return {
								color: stroke,
								weight: isNaN(weight) ? 2 : weight,
								opacity: 0.8,
								fillColor: fill,
								fillOpacity: isNaN(fillOpacity) ? 0.5 : fillOpacity
							};
						},
						onEachFeature: function (feature, layer) {
							layer.bindPopup(
								'<table class="simple-table">' +
								Object.entries(feature.properties).map(([key, value]) =>
									'<tr><td><strong>' + key + '</strong></td><td>' + value + '</td></tr>'
								).join('') +
								'</table>'
							);
						}
					});
					layers[index] = geojson;

					// Количество созданных layer'ов типа Point / CircleMarker в этом слое (отладочный лог)
					try {
						var createdArchMarkers = 0;
						geojson.eachLayer(function(l) {
							if (l && l.feature && l.feature.properties && l.feature.properties.type === 'architecture_form') {
								// Проверяем, является ли слой circleMarker (vector) или Marker (icon)
								if (l instanceof L.CircleMarker) createdArchMarkers++;
							}
						});
						console.log('[debug] layer', index, layerInfo.name, 'expectedArchPoints=', expectedArchPoints, 'createdArchMarkers=', createdArchMarkers);
					} catch (e) {
						console.log('[debug] layer', index, layerInfo.name, 'error counting markers', e);
					}

					// Центрируем карту по содержимому слоя
					if (geojson.getBounds && geojson.getBounds().isValid()) {
						map.fitBounds(geojson.getBounds(), {padding: [20, 20]});
					}

					if (index === 0) {
						switchLayer(0);
					}
				} catch (e) {
					console.error('Failed to load layer:', layerInfo.name, e);
					layers[index] = null;
				}
			});

			// Обработчик нажатия клавиш
			document.addEventListener('keydown', function(event) {
				var key = event.key;
				if (key >= '0' && key <= '9') {
					var layerIndex = parseInt(key) - 1;
					if (layerIndex < 0) layerIndex = 9;
					if (layerIndex < layers.length && layers[layerIndex]) switchLayer(layerIndex);
				} else if (key === 't' || key === 'T' || key === 'е' || key === 'Е') {
					switchToNextLayer();
				}
			});

			// Создаем вкладки при загрузке страницы
			createTabs();
		}
