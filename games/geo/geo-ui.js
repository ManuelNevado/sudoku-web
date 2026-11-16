/**
 * GeoQuiz UI Controller
 * Globe.gl integration, autocomplete inputs, flag grid, stats.
 */
const GeoGame = (() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let globe = null;
  let geoData = null;
  let selectedFlag = '';
  let answered = false;

  function init() {
    Components.init('../../');
    GeoEngine.reset();
    setupGlobe();
    bindEvents();
    updateStats();
    Components.refreshIcons();
  }

  // --- Globe ---

  function setupGlobe() {
    const container = $('#geo-globe');
    const isDark = document.body.classList.contains('dark');
    const size = Math.min(container.clientWidth || 400, 400);

    globe = Globe()
      .width(size)
      .height(size)
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor(isDark ? '#f59e0b' : '#d97706')
      .atmosphereAltitude(0.15)
      .polygonAltitude(d => d.__highlighted ? 0.04 : 0.005)
      .polygonCapColor(d => d.__highlighted
        ? (isDark ? '#f59e0b' : '#d97706')
        : (isDark ? '#3d352b' : '#e7e0d8'))
      .polygonSideColor(() => 'rgba(0,0,0,0.05)')
      .polygonStrokeColor(() => isDark ? '#564a3c' : '#c4b8aa')
      .polygonLabel(() => '')
      .onGlobeReady(() => {
        loadGeoData();
      })
      (container);

    globe.controls().enableZoom = false;
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
  }

  function loadGeoData() {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(topology => {
        // Convert TopoJSON to GeoJSON
        const geojson = topojsonFeature(topology, topology.objects.countries);
        geoData = geojson.features;
        startRound();
      })
      .catch(() => {
        // Fallback: play without globe polygons
        startRound();
      });
  }

  // Simple TopoJSON to GeoJSON converter (for countries)
  function topojsonFeature(topology, object) {
    const arcs = topology.arcs;
    const transform = topology.transform;

    function decodeArc(arcIndex) {
      const reverse = arcIndex < 0;
      const index = reverse ? ~arcIndex : arcIndex;
      const arc = arcs[index];
      const coords = [];
      let x = 0, y = 0;
      for (const [dx, dy] of arc) {
        x += dx;
        y += dy;
        coords.push([
          x * transform.scale[0] + transform.translate[0],
          y * transform.scale[1] + transform.translate[1]
        ]);
      }
      if (reverse) coords.reverse();
      return coords;
    }

    function decodeRing(arcs) {
      const coords = [];
      for (const arcIndex of arcs) {
        const decoded = decodeArc(arcIndex);
        for (let i = coords.length ? 1 : 0; i < decoded.length; i++) {
          coords.push(decoded[i]);
        }
      }
      return coords;
    }

    function decodeGeometry(geom) {
      if (geom.type === 'Polygon') {
        return { type: 'Polygon', coordinates: geom.arcs.map(decodeRing) };
      } else if (geom.type === 'MultiPolygon') {
        return {
          type: 'MultiPolygon',
          coordinates: geom.arcs.map(polygon => polygon.map(decodeRing))
        };
      }
      return geom;
    }

    const features = object.geometries.map(geom => ({
      type: 'Feature',
      id: geom.id,
      properties: geom.properties || {},
      geometry: decodeGeometry(geom)
    }));

    return { type: 'FeatureCollection', features };
  }

  function highlightCountry(country) {
    if (!geoData || !globe) return;

    let matchedFeature = null;
    const polygons = geoData.map(f => {
      f.__highlighted = isCountryMatch(f, country);
      if (f.__highlighted) matchedFeature = f;
      return f;
    });

    globe.polygonsData(polygons);

    // Calculate zoom based on country size
    const altitude = getAltitudeForCountry(matchedFeature);

    // Rotate globe to country
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: country.lat, lng: country.lng, altitude }, 1000);
  }

  function getAltitudeForCountry(feature) {
    if (!feature) return 2;

    // Estimate bounding box span of the country's geometry
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    const coords = feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates.flat(2)
      : feature.geometry.coordinates.flat(1);

    for (const [lng, lat] of coords) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }

    const span = Math.max(maxLat - minLat, maxLng - minLng);

    // Map span to altitude: tiny countries get close zoom, big ones stay far
    if (span < 2) return 0.5;
    if (span < 5) return 0.8;
    if (span < 10) return 1.2;
    if (span < 20) return 1.5;
    if (span < 40) return 1.8;
    return 2;
  }

  function isCountryMatch(feature, country) {
    // Match by numeric ISO code -> alpha-2 mapping
    const numToAlpha2 = getNumericMapping();
    const alpha2 = numToAlpha2[feature.id];
    return alpha2 === country.id;
  }

  // ISO 3166-1 numeric to alpha-2 mapping (most common countries)
  function getNumericMapping() {
    if (getNumericMapping._cache) return getNumericMapping._cache;
    const map = {};
    // Build from Countries.DATA using a known mapping
    // The world-atlas uses numeric codes, we need to map them
    const numCodes = {
      '004':'AF','008':'AL','012':'DZ','020':'AD','024':'AO','028':'AG','032':'AR','036':'AU',
      '040':'AT','044':'BS','048':'BH','050':'BD','051':'AM','052':'BB','056':'BE','060':'BM',
      '064':'BT','068':'BO','070':'BA','072':'BW','076':'BR','084':'BZ','090':'SB','092':'VG',
      '096':'BN','100':'BG','104':'MM','108':'BI','112':'BY','116':'KH','120':'CM','124':'CA',
      '132':'CV','140':'CF','144':'LK','148':'TD','152':'CL','156':'CN','158':'TW','170':'CO',
      '174':'KM','178':'CG','180':'CD','184':'CK','188':'CR','191':'HR','192':'CU','196':'CY',
      '203':'CZ','204':'BJ','208':'DK','212':'DM','214':'DO','218':'EC','222':'SV','226':'GQ',
      '231':'ET','232':'ER','233':'EE','234':'FO','238':'FK','242':'FJ','246':'FI','250':'FR',
      '254':'GF','258':'PF','262':'DJ','266':'GA','268':'GE','270':'GM','275':'PS','276':'DE',
      '288':'GH','296':'KI','300':'GR','304':'GL','308':'GD','316':'GU','320':'GT','324':'GN',
      '328':'GY','332':'HT','340':'HN','344':'HK','348':'HU','352':'IS','356':'IN','360':'ID',
      '364':'IR','368':'IQ','372':'IE','376':'IL','380':'IT','384':'CI','388':'JM','392':'JP',
      '398':'KZ','400':'JO','404':'KE','408':'KP','410':'KR','414':'KW','417':'KG','418':'LA',
      '422':'LB','426':'LS','428':'LV','430':'LR','434':'LY','438':'LI','440':'LT','442':'LU',
      '446':'MO','450':'MG','454':'MW','458':'MY','462':'MV','466':'ML','470':'MT','474':'MQ',
      '478':'MR','480':'MU','484':'MX','492':'MC','496':'MN','498':'MD','499':'ME','504':'MA',
      '508':'MZ','512':'OM','516':'NA','520':'NR','524':'NP','528':'NL','540':'NC','548':'VU',
      '554':'NZ','558':'NI','562':'NE','566':'NG','570':'NU','578':'NO','580':'MP','583':'FM',
      '584':'MH','585':'PW','586':'PK','591':'PA','598':'PG','600':'PY','604':'PE','608':'PH',
      '612':'PN','616':'PL','620':'PT','624':'GW','626':'TL','630':'PR','634':'QA','642':'RO',
      '643':'RU','646':'RW','654':'SH','659':'KN','660':'AI','662':'LC','666':'PM','670':'VC',
      '674':'SM','678':'ST','682':'SA','686':'SN','688':'RS','690':'SC','694':'SL','702':'SG',
      '703':'SK','704':'VN','705':'SI','706':'SO','710':'ZA','716':'ZW','720':'YE','724':'ES',
      '728':'SS','729':'SD','732':'EH','740':'SR','748':'SZ','752':'SE','756':'CH','760':'SY',
      '762':'TJ','764':'TH','768':'TG','776':'TO','780':'TT','784':'AE','788':'TN','792':'TR',
      '795':'TM','798':'TV','800':'UG','804':'UA','807':'MK','818':'EG','826':'GB','834':'TZ',
      '840':'US','854':'BF','858':'UY','860':'UZ','862':'VE','876':'WF','882':'WS','887':'YE',
      '894':'ZM'
    };
    getNumericMapping._cache = numCodes;
    return numCodes;
  }

  // --- UI ---

  function startRound() {
    answered = false;
    selectedFlag = '';

    const country = GeoEngine.pickCountry();
    highlightCountry(country);

    // Generate flag options
    const flagOptions = GeoEngine.generateFlagOptions(country);
    renderFlags(flagOptions);

    // Clear inputs
    $('#geo-name').value = '';
    $('#geo-capital').value = '';
    $('#geo-name').disabled = false;
    $('#geo-capital').disabled = false;

    // Reset result indicators
    $$('.geo-field').forEach(el => {
      el.classList.remove('geo-field--correct', 'geo-field--wrong');
    });
    $$('.geo-flag-btn').forEach(el => {
      el.classList.remove('selected', 'geo-flag-btn--correct', 'geo-flag-btn--wrong');
      el.disabled = false;
    });

    $('#geo-check').style.display = '';
    $('#geo-next').style.display = 'none';
    $('#geo-answer').style.display = 'none';

    // Focus name input
    setTimeout(() => $('#geo-name').focus(), 500);
  }

  function renderFlags(options) {
    const grid = $('#geo-flags');
    grid.innerHTML = '';
    options.forEach(country => {
      const btn = document.createElement('button');
      btn.className = 'geo-flag-btn';
      const img = document.createElement('img');
      img.src = `https://flagcdn.com/w80/${country.id.toLowerCase()}.png`;
      img.alt = country.name;
      img.width = 80;
      img.loading = 'eager';
      btn.appendChild(img);
      btn.dataset.id = country.id;
      btn.addEventListener('click', () => {
        if (answered) return;
        $$('.geo-flag-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedFlag = country.id;
      });
      grid.appendChild(btn);
    });
  }

  function bindEvents() {
    // Check button
    $('#geo-check').addEventListener('click', checkAnswer);

    // Next button
    $('#geo-next').addEventListener('click', () => {
      startRound();
      updateStats();
    });

    // Autocomplete for name
    setupAutocomplete('#geo-name', '#geo-name-suggestions', Countries.NAMES);

    // Autocomplete for capital
    setupAutocomplete('#geo-capital', '#geo-capital-suggestions', Countries.CAPITALS);

    // Enter key to check
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !answered) {
        // Close any open autocomplete first
        $$('.geo-suggestions').forEach(el => el.innerHTML = '');
        checkAnswer();
      }
    });

    // Theme change: update globe colors
    const observer = new MutationObserver(() => {
      if (globe) updateGlobeTheme();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  function updateGlobeTheme() {
    const isDark = document.body.classList.contains('dark');
    globe
      .atmosphereColor(isDark ? '#f59e0b' : '#d97706')
      .polygonCapColor(d => d.__highlighted
        ? (isDark ? '#f59e0b' : '#d97706')
        : (isDark ? '#3d352b' : '#e7e0d8'))
      .polygonStrokeColor(() => isDark ? '#564a3c' : '#c4b8aa');
  }

  function setupAutocomplete(inputSel, suggestSel, list) {
    const input = $(inputSel);
    const suggest = $(suggestSel);

    input.addEventListener('input', () => {
      const val = input.value;
      const matches = GeoEngine.filterSuggestions(val, list, 5);
      suggest.innerHTML = '';
      if (matches.length === 0 || !val) return;

      matches.forEach(match => {
        const div = document.createElement('div');
        div.className = 'geo-suggestion';
        div.textContent = match;
        div.addEventListener('mousedown', (e) => {
          e.preventDefault();
          input.value = match;
          suggest.innerHTML = '';
        });
        suggest.appendChild(div);
      });
    });

    input.addEventListener('blur', () => {
      setTimeout(() => suggest.innerHTML = '', 150);
    });

    input.addEventListener('keydown', (e) => {
      const items = suggest.querySelectorAll('.geo-suggestion');
      if (items.length === 0) return;

      if (e.key === 'Tab' || (e.key === 'Enter' && items.length > 0 && input.value)) {
        const first = items[0];
        if (first) {
          e.preventDefault();
          input.value = first.textContent;
          suggest.innerHTML = '';
        }
      }
    });
  }

  function checkAnswer() {
    if (answered) return;
    const name = $('#geo-name').value.trim();
    const capital = $('#geo-capital').value.trim();

    if (!name && !capital && !selectedFlag) return;

    answered = true;
    const result = GeoEngine.checkAnswers(name, capital, selectedFlag);
    const country = GeoEngine.getCurrent();

    // Show results on fields
    const nameField = $('#geo-name').closest('.geo-field');
    const capitalField = $('#geo-capital').closest('.geo-field');
    nameField.classList.add(result.name ? 'geo-field--correct' : 'geo-field--wrong');
    capitalField.classList.add(result.capital ? 'geo-field--correct' : 'geo-field--wrong');

    // Show results on flags
    $$('.geo-flag-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.id === country.id) {
        btn.classList.add('geo-flag-btn--correct');
      } else if (btn.classList.contains('selected') && !result.flag) {
        btn.classList.add('geo-flag-btn--wrong');
      }
    });

    // Disable inputs
    $('#geo-name').disabled = true;
    $('#geo-capital').disabled = true;

    // Show correct answer if any field is wrong
    if (!result.name || !result.capital || !result.flag) {
      const answerEl = $('#geo-answer');
      answerEl.style.display = 'block';
      answerEl.textContent = `${country.name} — Capital: ${country.capital}`;
    }

    // Switch buttons
    $('#geo-check').style.display = 'none';
    $('#geo-next').style.display = '';

    updateStats();
  }

  function updateStats() {
    const stats = GeoEngine.getStats();
    $('#geo-score').textContent = stats.score;
    $('#geo-streak').textContent = stats.streak;
    $('#geo-best').textContent = stats.bestStreak;
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', GeoGame.init);
