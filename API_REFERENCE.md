# 🔧 Developer API Reference

## Core Classes & Methods

### 🗺️ ZoneManager
Location: `firebase-config.js`

```javascript
// Save a new zone
await zoneManager.saveZone(ownerName, latlngs, distance, captureDate);
// Returns: zoneId

// Get all zones
const zones = await zoneManager.getAllZones();

// Get zone by ID
const zone = await zoneManager.getZoneById(zoneId);

// Capture zone (attack)
const success = await zoneManager.captureZone(zoneId, newOwnerName, distance);

// Get user's zones
const myZones = await zoneManager.getUserZones(userName);

// Get consistent color for owner
const color = zoneManager.getColorByOwner(ownerName);
```

---

### 🏆 LeaderboardManager
Location: `firebase-config.js`

```javascript
// Save a run
await leaderboardManager.saveRun(userName, distance, duration, routePolyline);

// Get global leaderboard
const leaders = await leaderboardManager.getGlobalLeaderboard(limit);

// Get city leaderboard
const city = await leaderboardManager.getCityLeaderboard(cityName, limit);

// Get user stats
const stats = await leaderboardManager.getUserStats(userName);

// Get user run history
const runs = await leaderboardManager.getUserRunHistory(userName, limit);
```

---

### 🔔 NotificationManager
Location: `notifications.js`

```javascript
// Add custom notification
notificationManager.addNotification(type, title, message, icon);

// Notify zone attack
notificationManager.notifyZoneAttack(attackerName, zoneSize);

// Notify zone lost
notificationManager.notifyZoneLost(newOwnerName, zoneSize);

// Notify personal best
notificationManager.notifyPersonalBest(distance);

// Notify zone captured
notificationManager.notifyZoneCaptured(distance);

// Notify achievement
notificationManager.notifyAchievement(badge, description);

// Get user notifications
const notifs = await notificationManager.getUserNotifications(limit);

// Clear old notifications
await notificationManager.clearOldNotifications(daysOld);
```

**Notification Types:** `'danger'`, `'success'`, `'warning'`, `'info'`, `'attack'`, `'zone'`

---

### 🏅 AchievementManager
Location: `notifications.js`

```javascript
// Check and unlock new achievements
await achievementManager.checkAchievements();

// Get user achievements
const achievements = await achievementManager.getUserAchievements(userName);

// Manual unlock
await achievementManager.unlockAchievement(userName, id, achievement);
```

**Available Achievements:**
- `first_run` - Complete first run
- `five_km` - Run 5 km total
- `half_marathon` - Run 21.1 km
- `marathon` - Run 42.2 km
- `zone_master` - Capture 5 zones
- `week_warrior` - Complete 7 runs

---

### 🛡️ AntiCheatValidator
Location: `advanced-features.js`

```javascript
// Validate entire run
const validation = antiCheatValidator.validateRun(runPoints, duration);
// Returns: { isValid: boolean, cheatingScore: 0-100, issues: array }

// Check for GPS jumps
const jumps = antiCheatValidator.checkGpsJumps(runPoints);

// Check for impossible speeds
const speeds = antiCheatValidator.checkImpossibleSpeeds(runPoints, duration);

// Check for suspicious straight lines
const lines = antiCheatValidator.checkSuspiciousStraightLine(runPoints);

// Calculate cheating score
const score = antiCheatValidator.calculateCheatingScore(issues);
```

**Validation Response:**
```javascript
{
  isValid: true,
  cheatingScore: 15,
  issues: [
    {
      type: "gps_jump",
      severity: "high",
      distance: "250.50"
    }
  ]
}
```

---

### 👥 SocialManager
Location: `advanced-features.js`

```javascript
// Add friend
await socialManager.addFriend(userName, friendName);

// Get friends
const friends = await socialManager.getFriends(userName);

// Get friends leaderboard
const leaderboard = await socialManager.getFriendsLeaderboard(userName);

// Share run
await socialManager.shareRun(runId, runData);

// Create challenge
const challengeId = await socialManager.createChallenge(type, duration, description);

// Join challenge
await socialManager.joinChallenge(challengeId);

// Get active challenges
const challenges = await socialManager.getActiveChallenges();
```

**Challenge Types:** `'distance'`, `'zones'`, `'speed'`, `'time'`

---

### 🗺️ MapEnhancer
Location: `advanced-features.js`

```javascript
// Create heatmap
MapEnhancer.createRunHeatmap(map, runs);

// Add compass
MapEnhancer.addCompass(map);

// Highlight zone boundaries
MapEnhancer.highlightZoneBoundaries(map, zones);

// Create speed indicator
MapEnhancer.createSpeedIndicator();
```

---

### 🎞️ RunReplayManager
Location: `advanced-features.js`

```javascript
// Start replay
await runReplayManager.startReplay(runId, mapElement);

// Play animation
runReplayManager.playRunAnimation(polyline, duration, mapElement);
```

---

## 🎮 Game Functions (run.js)

```javascript
// Start tracking a run
startRun();

// Stop tracking and save
stopRun();

// Capture zone
captureZone();

// Show zone details popup
showZonePopup(zone);

// Close zone popup
closeZonePopup();

// Attack zone
attackZone();

// Toggle leaderboard modal
toggleLeaderboard();

// Close leaderboard
closeLeaderboard();

// Switch leaderboard view
switchBoard(type); // 'global', 'city', 'zones'

// Display leaderboard
displayLeaderboard(data, type);

// Display zones list
displayZonesList(zones);

// Update location
updateLocation(pos);

// Calculate distance
calculateDistance(lat, lng);

// Calculate speed
calculateSpeed(speed);

// Update timer
updateTimer();

// Load and display all zones
displayAllZones();
```

---

## 🎨 Profile Functions (profile.js)

```javascript
// Load user stats
loadUserStats(userName);

// Load run history
loadRunHistory(userName);

// Initialize run map
initializeRunMap();

// Toggle menu
toggleMenu();

// Logout
logout();

// Go back to map
goBack();

// Go to profile
goProfile();
```

---

## 💾 Database Collections

### users
```javascript
{
  name: String,
  email: String,
  totalDistance: Number,
  totalRuns: Number,
  zonesOwned: Number,
  lastRun: Timestamp,
  joinedDate: Timestamp,
  city: String
}
```

### zones
```javascript
{
  zoneId: String,
  ownerName: String,
  coordinates: Array<{lat: Number, lng: Number}>,
  distance: Number,
  captureDate: String/Timestamp,
  color: String,
  status: String,
  attackCount: Number,
  createdAt: Timestamp
}
```

### runs
```javascript
{
  userId: String,
  userName: String,
  distance: Number,
  duration: Number,
  routePolyline: Array<Array<Number>>,
  date: Timestamp,
  pace: Number,
  coordinates: Array<{lat: Number, lng: Number}>
}
```

### notifications
```javascript
{
  userId: String,
  type: String,
  title: String,
  message: String,
  icon: String,
  timestamp: Timestamp,
  createdAt: Timestamp
}
```

### achievements
```javascript
{
  userId: String,
  id: String,
  name: String,
  icon: String,
  description: String,
  unlockedAt: Timestamp
}
```

### friends
```javascript
{
  userId: String,
  friendName: String,
  addedAt: Timestamp,
  status: String
}
```

### challenges
```javascript
{
  creatorId: String,
  type: String,
  duration: Number,
  description: String,
  startDate: Timestamp,
  endDate: Timestamp,
  participants: Array<String>,
  createdAt: Timestamp
}
```

### shared_runs
```javascript
{
  userId: String,
  runId: String,
  distance: Number,
  duration: Number,
  date: Timestamp,
  shareLink: String
}
```

---

## 🔐 LocalStorage Keys

```javascript
// User data
localStorage.getItem("runnerUser")
// Returns: { name: String, email: String, password: String }

// Login state
localStorage.getItem("isLoggedIn")
// Returns: "true" or "false"
```

---

## 🌐 Global Variables

```javascript
// Map instance
window.map
window.userMap

// Firebase managers
window.zoneManager
window.leaderboardManager
window.notificationManager
window.achievementManager
window.antiCheatValidator
window.socialManager

// Current zone being attacked
window.currentZoneId
window.currentZoneDistance

// Run data
totalDistance
runPoints []
currentSpeed
speedTracker []
startTime
timerInterval
```

---

## 🚀 Common Workflows

### Start a Run
```javascript
function startRun() {
  startTime = Date.now();
  // GPS tracking begins...
  // Distance calculated automatically
  // Speed updated every second
}
```

### Capture a Zone
```javascript
async function captureZone() {
  const zoneId = await zoneManager.saveZone(
    userName,
    runPoints,
    totalDistance,
    new Date().toISOString()
  );
  // Zone appears on map
  // Notifications sent if needed
}
```

### Attack a Zone
```javascript
async function attackZone() {
  if (totalDistance > currentZoneDistance) {
    const success = await zoneManager.captureZone(
      currentZoneId,
      userName,
      totalDistance
    );
    if (success) {
      // Ownership transferred
      // Notification sent to old owner
    }
  }
}
```

### Show Leaderboard
```javascript
async function switchBoard(type) {
  if (type === "global") {
    const data = await leaderboardManager.getGlobalLeaderboard(10);
    displayLeaderboard(data, type);
  }
}
```

### Validate Run
```javascript
const validation = antiCheatValidator.validateRun(runPoints, duration);
if (!validation.isValid) {
  alert("Run validation failed. Score: " + validation.cheatingScore);
  return;
}
// Save run if valid
```

---

## 📊 Statistics Calculation

```javascript
// Calculate pace (min/km)
const pace = (duration / distance).toFixed(2);

// Calculate average speed (km/h)
const avgSpeed = (distance / (duration / 3600)).toFixed(1);

// Calculate cheating score (0-100)
const cheatingScore = antiCheatValidator.calculateCheatingScore(issues);

// Get haversine distance between two points
const distance = getDistance(lat1, lon1, lat2, lon2);
```

---

## ⚠️ Error Handling

```javascript
try {
  await zoneManager.saveZone(...);
} catch (error) {
  console.error("Error saving zone:", error);
  notificationManager.addNotification(
    "danger",
    "Save Failed",
    error.message,
    "❌"
  );
}
```

---

## 🧪 Testing Functions

```javascript
// Test notification
notificationManager.notifyPersonalBest(10.5);

// Test leaderboard fetch
const global = await leaderboardManager.getGlobalLeaderboard(5);

// Test anti-cheat
const validation = antiCheatValidator.validateRun(runPoints, 1200);

// Test zone creation
await zoneManager.saveZone("TestUser", [[28, 77], [29, 78]], 5.2, new Date());
```

---

**Last Updated:** Feb 23, 2024
**Version:** 1.0.0
