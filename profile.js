let userMap;

// LOAD USER DATA ON PAGE LOAD
document.addEventListener("DOMContentLoaded", async function () {
  const user = JSON.parse(localStorage.getItem("runnerUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("userName").innerText = user.name;
  document.getElementById("joinDate").innerText = `Member since: ${new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString()}`;

  // Load user stats from database
  await loadUserStats(user.name);

  // Load run history
  await loadRunHistory(user.name);

  // Initialize map
  initializeRunMap();
});

// LOAD USER STATS
async function loadUserStats(userName) {
  try {
    const stats = await leaderboardManager.getUserStats(userName);
    
    if (stats) {
      document.getElementById("totalDist").innerHTML = `${(stats.totalDistance || 0).toFixed(1)}<span style="font-size: 20px;"> km</span>`;
      document.getElementById("runsCount").innerText = stats.totalRuns || 0;
      
      // Get zones owned
      const zones = await zoneManager.getUserZones(userName);
      document.getElementById("zonesCount").innerText = zones.length;
      
      // Calculate average pace
      if (stats.totalRuns && stats.totalDistance) {
        const avgPace = (stats.totalDistance / stats.totalRuns).toFixed(1);
        document.getElementById("avgPace").innerHTML = `${avgPace}<span style="font-size: 20px;"> min/km</span>`;
      }
    }
  } catch (error) {
    console.error("Error loading user stats:", error);
  }
}

// LOAD RUN HISTORY
async function loadRunHistory(userName) {
  try {
    const runs = await leaderboardManager.getUserRunHistory(userName, 20);
    const container = document.getElementById("runsList");

    if (!runs || runs.length === 0) {
      container.innerHTML = "<p style='text-align: center; color: #999;'>No runs yet. Start running! 🏃</p>";
      return;
    }

    let html = "";
    runs.forEach((run, index) => {
      const date = new Date(run.date).toLocaleDateString();
      const time = new Date(run.date).toLocaleTimeString();
      const duration = Math.floor(run.duration / 60);
      const seconds = run.duration % 60;

      html += `
        <div class="run-item">
          <div>
            <div class="run-date">${date} at ${time}</div>
            <div class="run-time">${duration}m ${seconds}s</div>
          </div>
          <divide class="run-distance">${run.distance.toFixed(2)} km</div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error("Error loading run history:", error);
    document.getElementById("runsList").innerHTML = "<p>Error loading runs</p>";
  }
}

// INITIALIZE MAP FOR RUN VISUALIZATION
async function initializeRunMap() {
  userMap = L.map('runMap').setView([20, 77], 10);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(userMap);

  const user = JSON.parse(localStorage.getItem("runnerUser"));
  
  try {
    const runs = await leaderboardManager.getUserRunHistory(user.name, 50);
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"];

    runs.forEach((run, index) => {
      if (run.routePolyline && run.routePolyline.length > 0) {
        const polyline = L.polyline(run.routePolyline, {
          color: colors[index % colors.length],
          weight: 2,
          opacity: 0.7
        }).addTo(userMap);
      }
    });

    // Fit map to bounds
    if (runs.length > 0 && runs[0].routePolyline) {
      const bounds = L.latLngBounds(runs[0].routePolyline);
      userMap.fitBounds(bounds, { padding: [50, 50] });
    }
  } catch (error) {
    console.error("Error loading runs for map:", error);
  }
}

// TOGGLE MENU
function toggleMenu() {
  const menu = document.getElementById("profileMenu");
  if (menu) {
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }
}

// LOGOUT
function logout() {
  localStorage.removeItem("runnerUser");
  localStorage.removeItem("isLoggedIn");
  alert("Logged Out 👋");
  window.location.href = "index.html";
}

// GO BACK
function goBack() {
  window.location.href = "run.html";
}

// GO PROFILE (in case called from other pages)
function goProfile() {
  window.location.href = "profile.html";
}
