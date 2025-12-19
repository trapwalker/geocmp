# Примеры кастомизации geocmp

Эта директория содержит примеры пользовательских CSS и JavaScript файлов для кастомизации генерируемых HTML-карт.

## Использование

### Пример с выделением объектов по типу

Используйте примеры из этой директории для добавления возможности выделения объектов:

```bash
geocmp -o map.html --ext-css examples/custom.css --ext-js examples/custom.js data/*.geojson
```

### Только CSS

Если нужны только стили:

```bash
geocmp -o map.html --ext-css examples/custom.css data/*.geojson
```

### Только JavaScript

Если нужна только функциональность выделения:

```bash
geocmp -o map.html --ext-js examples/custom.js data/*.geojson
```

## Файлы примеров

### custom.css

Демонстрирует стилизацию:
- Информационной панели (#info)
- Активного слоя (.layer-item.active)
- Номеров горячих клавиш (.layer-hotkey)
- Кнопки настроек (.leaflet-control-settings)
- Слайдеров прозрачности (.opacity-slider)

### custom.js

Простейший пример пользовательского JavaScript кода:

```javascript
// Пример пользовательского скрипта
// Нажмите Q чтобы увидеть сообщение

console.log('Custom script loaded! Press Q to test.');

document.addEventListener('keydown', function(event) {
    if (event.key === 'q' || event.key === 'Q') {
        alert('Custom script works! ✓\n\nYou can add any JavaScript code here.');
    }
});
```

#### Что делает этот пример:

- При нажатии клавиши **Q** показывает alert с сообщением
- Выводит сообщение в консоль браузера при загрузке
- Всего **10 строк кода** - максимально просто!

#### Как использовать:

1. Откройте сгенерированный HTML файл в браузере
2. Нажмите **Q**
3. Увидите сообщение "Custom script works!"

Это базовый пример, на основе которого вы можете создать свою функциональность.

## Встроенные горячие клавиши

Эти клавиши работают всегда (встроены в основной скрипт):

- **1-9, 0** - Переключение на слой 1-10
- **T, E, Пробел** - Следующий активный слой
- **I** - Скрыть/показать информационную панель
- **H** - Показать справку по горячим клавишам

## Дополнительные горячие клавиши (из custom.js)

- **Q** - Показать тестовое сообщение (демонстрация работы пользовательского скрипта)

## Создание собственных файлов

### Пример 1: Выделение по другому свойству

```javascript
// highlight-by-name.js
// Выделяет объекты по свойству "name" вместо "type"

function onFeatureClick(e) {
    const layer = e.target;
    const name = layer.feature.properties?.name;

    if (!name) return;

    map.eachLayer((l) => {
        if (l.feature?.properties?.name === name) {
            l.setStyle({ opacity: 1, weight: 4 });
        } else {
            l.setStyle({ opacity: 0.3 });
        }
    });
}
```

### Пример 2: Автоматическое переключение слоёв

```javascript
// auto-switch.js
let autoSwitch = false;
let switchInterval = null;

document.addEventListener('keydown', (event) => {
    if (event.key === 'a' || event.key === 'A') {
        autoSwitch = !autoSwitch;

        if (autoSwitch) {
            switchInterval = setInterval(() => {
                // Имитация нажатия T для переключения
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 't'}));
            }, 3000);
        } else {
            clearInterval(switchInterval);
        }
    }
});
```

### Пример 3: Фильтрация по значению

```javascript
// filter-by-value.js
function filterByProperty(key, value) {
    const map = getLeafletMap();

    map.eachLayer((layer) => {
        if (layer.feature && layer.setStyle) {
            if (layer.feature.properties[key] === value) {
                layer.setStyle({ opacity: 1 });
            } else {
                layer.setStyle({ opacity: 0.1 });
            }
        }
    });
}

// Использование через консоль браузера:
// filterByProperty('status', 'active')
```

### Пример 4: Измерение расстояний

```javascript
// measure-distance.js
let measureMode = false;
let measurePoints = [];

document.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
        measureMode = !measureMode;
        console.log('Measure mode:', measureMode);

        if (!measureMode) {
            // Очистка точек измерения
            measurePoints.forEach(m => m.remove());
            measurePoints = [];
        }
    }
});

map.on('click', (e) => {
    if (!measureMode) return;

    const marker = L.circleMarker(e.latlng, {
        radius: 5,
        color: 'red'
    }).addTo(map);

    measurePoints.push(marker);

    if (measurePoints.length >= 2) {
        const from = measurePoints[measurePoints.length - 2].getLatLng();
        const to = measurePoints[measurePoints.length - 1].getLatLng();
        const distance = from.distanceTo(to);
        console.log(`Distance: ${distance.toFixed(2)} meters`);
    }
});
```

## Доступные элементы DOM

Основные элементы для кастомизации:

- `#map` - контейнер карты Leaflet
- `#base-layer-control` - панель управления подложкой
- `#tabs` - панель списка слоёв данных
- `#info` - информационная панель
- `.layer-item` - элемент списка слоёв
- `.layer-item.active` - активный слой
- `.layer-hotkey` - номер горячей клавиши
- `.layer-name` - название слоя
- `.leaflet-control-settings` - кнопка настроек
- `.base-layer-select` - выпадающий список базовых слоёв
- `.opacity-slider` - слайдеры прозрачности
- `.bg-toggle` - кнопка переключения фона

## Доступ к карте Leaflet

```javascript
function getLeafletMap() {
    const mapElement = document.getElementById('map');
    if (mapElement && window.L && mapElement._leaflet_id) {
        return L.Map._maps ? L.Map._maps[mapElement._leaflet_id] : null;
    }
    return null;
}

// Использование
const map = getLeafletMap();
if (map) {
    map.eachLayer((layer) => {
        console.log(layer.feature);
    });
}
```

## Полезные функции

### Получить все объекты с определённым свойством

```javascript
function getFeaturesByProperty(key, value) {
    const map = getLeafletMap();
    const features = [];

    map.eachLayer((layer) => {
        if (layer.feature?.properties?.[key] === value) {
            features.push(layer.feature);
        }
    });

    return features;
}
```

### Центрировать карту на объектах

```javascript
function fitBoundsToType(type) {
    const map = getLeafletMap();
    const group = L.featureGroup();

    map.eachLayer((layer) => {
        if (layer.feature?.properties?.type === type) {
            group.addLayer(layer);
        }
    });

    if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
}
```

### Экспорт выделенных объектов

```javascript
function exportSelectedFeatures(type) {
    const map = getLeafletMap();
    const features = [];

    map.eachLayer((layer) => {
        if (layer.feature?.properties?.type === type) {
            features.push(layer.feature);
        }
    });

    const geojson = {
        type: 'FeatureCollection',
        features: features
    };

    console.log(JSON.stringify(geojson, null, 2));
    return geojson;
}
```

## Отладка

Для отладки пользовательских скриптов:

1. Откройте консоль браузера (**F12**)
2. Проверьте наличие ошибок JavaScript
3. Используйте `console.log()` для вывода отладочной информации
4. Проверьте загрузку скрипта: смотрите сообщение "Custom script loaded" в консоли
5. Проверьте структуру данных:
   ```javascript
   const map = getLeafletMap();
   map.eachLayer((layer) => {
       if (layer.feature) {
           console.log(layer.feature.properties);
       }
   });
   ```

## Полезные ссылки

- [Leaflet API Documentation](https://leafletjs.com/reference.html)
- [Leaflet Tutorial](https://leafletjs.com/examples.html)
- [GeoJSON Specification](https://geojson.org/)
- [JavaScript Event Reference](https://developer.mozilla.org/en-US/docs/Web/Events)
- [CSS Селекторы](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
