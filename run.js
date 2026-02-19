// ===== MAP INIT =====
let map = L.map('map').setView([20, 77], 5);
let marker;
let watchId;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ===== RUN DATA =====
let startTime = 0;
let timerInterval;
let totalDistance = 0;
let lastCoords = null;

let runPoints = [];
let routeLine;


// ===== START RUN =====
function startRun() {

  startTime = Date.now();
  totalDistance = 0;
  runPoints = [];
  lastCoords = null;

  timerInterval = setInterval(updateTimer, 1000);

  navigator.geolocation.getCurrentPosition(pos => {

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    map.setView([lat, lng], 17);

    if (marker) map.removeLayer(marker);

    marker = L.marker([lat, lng]).addTo(map);

    runPoints.push([lat, lng]);

    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.polyline(runPoints, { color: "blue" }).addTo(map);

    watchId = navigator.geolocation.watchPosition(updateLocation, null, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    });

  });
}


// ===== UPDATE LOCATION =====
function updateLocation(pos) {

  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  marker.setLatLng([lat, lng]);
  map.panTo([lat, lng]);

  runPoints.push([lat, lng]);
  routeLine.setLatLngs(runPoints);

  calculateDistance(lat, lng);

  // LOOP CHECK
  if (runPoints.length > 10) {

    const start = runPoints[0];
    const current = runPoints[runPoints.length - 1];

    const loopDistance = getDistanceMeters(
      start[0], start[1],
      current[0], current[1]
    );

    if (loopDistance < 50) {
      captureBlueZone();
    }
  }
}


// ===== STOP RUN =====
function stopRun() {

  navigator.geolocation.clearWatch(watchId);
  clearInterval(timerInterval);

  if (runPoints.length > 3) {
    L.polygon(runPoints, {
      color: "red",
      fillOpacity: 0.3
    }).addTo(map);
  }

  alert("Territory Captured 🟥");
}


// ===== DISTANCE =====
function calculateDistance(lat, lng) {

  if (lastCoords) {

    const d = getDistance(
      lastCoords.lat,
      lastCoords.lng,
      lat,
      lng
    );

    totalDistance += d;
  }

  lastCoords = { lat, lng };

  document.getElementById("distance").innerText =
    totalDistance.toFixed(2) + " km";
}


// ===== HAVERSINE KM =====
function getDistance(lat1, lon1, lat2, lon2) {

  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


// ===== HAVERSINE METERS =====
function getDistanceMeters(lat1, lon1, lat2, lon2) {

  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI/180) *
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


// ===== TIMER =====
function updateTimer() {

  let diff = Math.floor((Date.now() - startTime) / 1000);
  let min = Math.floor(diff / 60);
  let sec = diff % 60;

  document.getElementById("time").innerText =
    `${min}:${sec.toString().padStart(2,"0")}`;
}


// ===== BLUE ZONE =====
function captureBlueZone() {

  navigator.geolocation.clearWatch(watchId);
  clearInterval(timerInterval);

  L.polygon(runPoints, {
    color: "blue",
    fillOpacity: 0.4
  }).addTo(map);

  alert("Blue Zone Captured 🟦");
}
