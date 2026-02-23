// ===== MAP INIT =====
let map = L.map('map').setView([20, 77], 5);
let marker;
let watchId;
let zonePolygons = {}; // Store zone polygons by ID

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
let currentSpeed = 0;
let speedTracker = [];
let lastGPSTime = 0;

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", async function () {
  const user = JSON.parse(localStorage.getItem("runnerUser"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Load zones from database
  await displayAllZones();

  // Set user's location on map
  navigator.geolocation.getCurrentPosition(pos => {
    map.setView([pos.coords.latitude, pos.coords.longitude], 15);
  });
});

// ===== LOAD & DISPLAY ALL ZONES =====
async function displayAllZones() {
  try {
    const zones = await zoneManager.getAllZones();
    
    zones.forEach(zone => {
      if (zone.coordinates && zone.coordinates.length > 0) {
        const latlngs = zone.coordinates.map(c => [c.lat, c.lng]);
        
        const polygon = L.polygon(latlngs, {
          color: zone.color || "#999",
          weight: 2,
          fillOpacity: 0.4
        }).addTo(map);

        // Add click event to show zone details
        polygon.on('click', () => showZonePopup(zone));
        
        zonePolygons[zone.zoneId] = polygon;
      }
    });
  } catch (error) {
    console.error("Error displaying zones:", error);
  }
}

// ===== ZONE POPUP =====
function showZonePopup(zone) {
  document.getElementById("popupOwner").innerText = `👑 King: ${zone.ownerName}`;
  document.getElementById("popupDistance").innerText = `Distance: ${zone.distance.toFixed(2)} km`;
  document.getElementById("popupDate").innerText = `Captured on: ${new Date(zone.captureDate).toLocaleDateString()}`;
  
  // Store current zone for attack
  window.currentZoneId = zone.zoneId;
  window.currentZoneDistance = zone.distance;
  
  const popup = document.getElementById("zonePopup");
  popup.style.display = "block";
}

function closeZonePopup() {
  document.getElementById("zonePopup").style.display = "none";
  window.currentZoneId = null;
}

// ===== START RUN =====
function startRun() {
  const user = JSON.parse(localStorage.getItem("runnerUser"));
  if (!user) {
    alert("Please login first");
    return;
  }

  startTime = Date.now();
  totalDistance = 0;
  currentSpeed = 0;
  runPoints = [];
  speedTracker = [];
  lastCoords = null;
  lastGPSTime = Date.now();

  timerInterval = setInterval(updateTimer, 1000);

  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    map.setView([lat, lng], 17);

    if (marker) map.removeLayer(marker);

    marker = L.marker([lat, lng], {
      title: "Your Location"
    }).addTo(map);

    runPoints.push([lat, lng]);

    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.polyline(runPoints, { color: "blue", weight: 3 }).addTo(map);

    watchId = navigator.geolocation.watchPosition(updateLocation, onGPSError, {
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
  const speed = pos.coords.speed || 0;

  // Anti-cheat: Check for impossible speeds (> 50 km/h for running)
  if (speed && speed > 15) { // 15 m/s = 54 km/h (filter unrealistic data)
    console.warn("Possible GPS jump detected - ignoring point");
    return;
  }

  marker.setLatLng([lat, lng]);
  map.panTo([lat, lng]);

  runPoints.push([lat, lng]);
  routeLine.setLatLngs(runPoints);

  calculateDistance(lat, lng);
  calculateSpeed(speed);

  // Check for zone loop capture
  if (runPoints.length > 10) {
    const start = runPoints[0];
    const current = runPoints[runPoints.length - 1];

    const loopDistance = getDistanceMeters(
      start[0], start[1],
      current[0], current[1]
    );

    if (loopDistance < 50) {
      captureZone();
    }
  }
}

// ===== GPS ERROR HANDLER =====
function onGPSError(error) {
  console.error("GPS Error:", error.message);
  alert("⚠️ GPS Error: " + error.message);
}

// ===== STOP RUN =====
async function stopRun() {
  navigator.geolocation.clearWatch(watchId);
  clearInterval(timerInterval);

  const user = JSON.parse(localStorage.getItem("runnerUser"));

  if (runPoints.length > 3) {
    // Save run to database
    const duration = Math.floor((Date.now() - startTime) / 1000); // seconds

    try {
      await leaderboardManager.saveRun(
        user.name,
        totalDistance,
        duration,
        runPoints
      );
      
      alert(`🏃 Run Saved! ${totalDistance.toFixed(2)} km in ${Math.floor(duration/60)}:${(duration%60).toString().padStart(2,'0')}`);
    } catch (error) {
      console.error("Error saving run:", error);
      alert("Error saving run, but distance recorded locally");
    }

    // Reset tracker
    totalDistance = 0;
    currentSpeed = 0;
    runPoints = [];
    if (routeLine) routeLine.setLatLngs(runPoints);
  }
}

// ===== CAPTURE ZONE =====
async function captureZone() {
  navigator.geolocation.clearWatch(watchId);
  clearInterval(timerInterval);

  const user = JSON.parse(localStorage.getItem("runnerUser"));

  if (runPoints.length > 3) {
    try {
      const zoneId = await zoneManager.saveZone(
        user.name,
        runPoints,
        totalDistance,
        new Date().toISOString()
      );

      // Add zone to map
      const color = zoneManager.getColorByOwner(user.name);
      const polygon = L.polygon(runPoints, {
        color: color,
        weight: 2,
        fillOpacity: 0.4
      }).addTo(map);

      polygon.on('click', () => {
        showZonePopup({
          zoneId,
          ownerName: user.name,
          distance: totalDistance,
          captureDate: new Date().toISOString(),
          color
        });
      });

      zonePolygons[zoneId] = polygon;

      alert(`✅ Zone Captured! 👑 ${user.name}\n📍 Size: ${totalDistance.toFixed(2)} km`);
    } catch (error) {
      console.error("Error capturing zone:", error);
      alert("Error capturing zone");
    }
  }

  // Reset
  totalDistance = 0;
  currentSpeed = 0;
  runPoints = [];
  speedTracker = [];
}

// ===== DISTANCE CALCULATION =====
function calculateDistance(lat, lng) {
  if (lastCoords) {
    const d = getDistance(
      lastCoords.lat,
      lastCoords.lng,
      lat,
      lng
    );

    // Filter outliers (GPS noise)
    if (d < 0.5) { // Max 500m per update
      totalDistance += d;
    }
  }

  lastCoords = { lat, lng };

  document.getElementById("distance").innerText =
    totalDistance.toFixed(2) + " km";
}

// ===== SPEED CALCULATION =====
function calculateSpeed(speed) {
  const now = Date.now();
  const timeDelta = (now - lastGPSTime) / 1000; // seconds

  if (timeDelta > 0) {
    currentSpeed = speed || 0;
    speedTracker.push(currentSpeed);

    // Keep only last 10 readings for smoother display
    if (speedTracker.length > 10) {
      speedTracker.shift();
    }

    const avgSpeed = (speedTracker.reduce((a, b) => a + b, 0) / speedTracker.length) * 3.6; // m/s to km/h
    document.getElementById("speed").innerText = avgSpeed.toFixed(1) + " km/h";
  }

  lastGPSTime = now;
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

// ===== ATTACK ZONE =====
async function attackZone() {
  if (!window.currentZoneId) {
    alert("No zone selected");
    return;
  }

  if (totalDistance > window.currentZoneDistance) {
    const user = JSON.parse(localStorage.getItem("runnerUser"));
    const success = await zoneManager.captureZone(
      window.currentZoneId,
      user.name,
      totalDistance
    );

    if (success) {
      alert("🎉 Zone Conquered! " + user.name + " is the new 👑");
      closeZonePopup();
      await displayAllZones(); // Refresh map
    } else {
      alert("⚔️ Not enough distance to capture this zone!");
    }
  } else {
    alert("You need to run more distance than the current owner!");
  }
}

// Store attack function globally
document.addEventListener("DOMContentLoaded", function() {
  const attackBtn = document.getElementById("attackBtn");
  if (attackBtn) {
    attackBtn.onclick = attackZone;
  }
});

// ===== LEADERBOARD FUNCTIONS =====
function toggleLeaderboard() {
  const modal = document.getElementById("leaderboardModal");
  modal.style.display = modal.style.display === "none" ? "block" : "none";
  if (modal.style.display === "block") {
    switchBoard('global');
  }
}

function closeLeaderboard() {
  document.getElementById("leaderboardModal").style.display = "none";
}

async function switchBoard(type) {
  const content = document.getElementById("leaderboardContent");
  content.innerHTML = "Loading...";

  // Update tab styling
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  try {
    let data;
    if (type === "global") {
      data = await leaderboardManager.getGlobalLeaderboard(10);
      displayLeaderboard(data, type);
    } else if (type === "city") {
      // For now, using global. Extend to use city-based leaderboard
      data = await leaderboardManager.getGlobalLeaderboard(10);
      displayLeaderboard(data, type);
    } else if (type === "zones") {
      const user = JSON.parse(localStorage.getItem("runnerUser"));
      data = await zoneManager.getUserZones(user.name);
      displayZonesList(data);
    }
  } catch (error) {
    console.error("Error switching board:", error);
    content.innerHTML = "<p>Error loading leaderboard</p>";
  }
}

function displayLeaderboard(data, type) {
  const content = document.getElementById("leaderboardContent");
  
  if (!data || data.length === 0) {
    content.innerHTML = "<p>No data yet</p>";
    return;
  }

  let html = '<div class="leaderboard-header"><span>Rank</span><span>Runner</span><span>Distance</span></div>';
  
  data.forEach((user, index) => {
    html += `
      <div class="leaderboard-item">
        <span class="rank">${index + 1}</span>
        <span class="name">${user.name}</span>
        <span class="distance">${user.totalDistance?.toFixed(2) || 0} km</span>
      </div>
    `;
  });

  content.innerHTML = html;
}

function displayZonesList(zones) {
  const content = document.getElementById("leaderboardContent");
  
  if (!zones || zones.length === 0) {
    content.innerHTML = "<p>No zones owned yet</p>";
    return;
  }

  let html = '<div class="zones-header"><span>Zone #</span><span>Distance</span><span>Captured</span></div>';
  
  zones.forEach((zone, index) => {
    const date = new Date(zone.captureDate).toLocaleDateString();
    html += `
      <div class="zone-item">
        <span class="zone-num">${index + 1}</span>
        <span class="distance">${zone.distance?.toFixed(2) || 0} km</span>
        <span class="date">${date}</span>
      </div>
    `;
  });

  content.innerHTML = html;
}
