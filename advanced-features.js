// ===== ADVANCED FEATURES =====

// ===== RUN REPLAY SYSTEM =====
class RunReplayManager {
  
  async startReplay(runId, mapElement) {
    try {
      const run = await db.collection("runs").doc(runId).get();
      if (!run.exists) {
        console.error("Run not found");
        return;
      }

      const runData = run.data();
      const polyline = runData.routePolyline;
      const duration = runData.duration;

      this.playRunAnimation(polyline, duration, mapElement);
    } catch (error) {
      console.error("Error starting replay:", error);
    }
  }

  playRunAnimation(polyline, duration, mapElement) {
    if (!polyline || polyline.length === 0) return;

    let currentIndex = 0;
    const stepDuration = (duration * 1000) / polyline.length;
    const animationMarker = L.marker(polyline[0]).addTo(window.userMap);

    const replayInterval = setInterval(() => {
      if (currentIndex < polyline.length) {
        const point = polyline[currentIndex];
        animationMarker.setLatLng([point[0], point[1]]);
        window.userMap.panTo([point[0], point[1]]);
        currentIndex++;
      } else {
        clearInterval(replayInterval);
        animationMarker.remove();
      }
    }, stepDuration);
  }
}

// ===== ANTI-CHEAT SYSTEM =====
class AntiCheatValidator {
  
  constructor() {
    this.maxRunSpeed = 15; // m/s = 54 km/h (maximum realistic running speed)
    this.maxGpsJump = 100; // meters
    this.minGpsAccuracy = 50; // meters
  }

  // ===== VALIDATE ENTIRE RUN =====
  validateRun(runPoints, duration) {
    const issues = [];

    // Check for GPS jumps
    const jumpIssues = this.checkGpsJumps(runPoints);
    if (jumpIssues.length > 0) issues.push(...jumpIssues);

    // Check for impossible speeds
    const speedIssues = this.checkImpossibleSpeeds(runPoints, duration);
    if (speedIssues.length > 0) issues.push(...speedIssues);

    // Check GPS straight line (teleportation)
    const straightlineIssues = this.checkSuspiciousStraightLine(runPoints);
    if (straightlineIssues.length > 0) issues.push(...straightlineIssues);

    return {
      isValid: issues.length === 0,
      cheatingScore: this.calculateCheatingScore(issues),
      issues
    };
  }

  // ===== CHECK FOR GPS JUMPS =====
  checkGpsJumps(runPoints) {
    const issues = [];
    
    for (let i = 1; i < runPoints.length; i++) {
      const distance = this.getDistanceMeters(
        runPoints[i-1][0], runPoints[i-1][1],
        runPoints[i][0], runPoints[i][1]
      );

      if (distance > this.maxGpsJump) {
        issues.push({
          type: "gps_jump",
          severity: "high",
          pointIndex: i,
          distance: distance.toFixed(2)
        });
      }
    }

    return issues;
  }

  // ===== CHECK FOR IMPOSSIBLE SPEEDS =====
  checkImpossibleSpeeds(runPoints, duration) {
    const issues = [];
    const timePerPoint = duration / runPoints.length;

    for (let i = 1; i < runPoints.length; i++) {
      const distance = this.getDistanceMeters(
        runPoints[i-1][0], runPoints[i-1][1],
        runPoints[i][0], runPoints[i][1]
      );

      const speed = distance / timePerPoint; // m/s

      if (speed > this.maxRunSpeed) {
        issues.push({
          type: "impossible_speed",
          severity: "high",
          pointIndex: i,
          speed: (speed * 3.6).toFixed(2) // km/h
        });
      }
    }

    return issues;
  }

  // ===== CHECK FOR SUSPICIOUS STRAIGHT LINES =====
  checkSuspiciousStraightLine(runPoints) {
    const issues = [];
    
    // If more than 70% of run is in straight line = suspicious
    let straightSegments = 0;
    
    for (let i = 1; i < runPoints.length - 1; i++) {
      const bearing1 = this.getBearing(runPoints[i-1], runPoints[i]);
      const bearing2 = this.getBearing(runPoints[i], runPoints[i+1]);
      
      const angleDiff = Math.abs(bearing1 - bearing2);
      
      if (angleDiff < 5 || angleDiff > 355) { // Nearly same bearing
        straightSegments++;
      }
    }

    const straightPercentage = (straightSegments / runPoints.length) * 100;
    
    if (straightPercentage > 70) {
      issues.push({
        type: "suspicious_straight_line",
        severity: "medium",
        percentStraight: straightPercentage.toFixed(1)
      });
    }

    return issues;
  }

  // ===== CALCULATE CHEATING SCORE =====
  calculateCheatingScore(issues) {
    let score = 0;
    
    issues.forEach(issue => {
      if (issue.severity === "high") score += 30;
      if (issue.severity === "medium") score += 15;
      if (issue.severity === "low") score += 5;
    });

    return Math.min(score, 100); // 0-100 scale
  }

  // ===== HAVERSINE DISTANCE =====
  getDistanceMeters(lat1, lon1, lat2, lon2) {
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

  // ===== GET BEARING BETWEEN TWO POINTS =====
  getBearing(point1, point2) {
    const lat1 = point1[0] * Math.PI / 180;
    const lon1 = point1[1] * Math.PI / 180;
    const lat2 = point2[0] * Math.PI / 180;
    const lon2 = point2[1] * Math.PI / 180;

    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
}

// ===== SOCIAL FEATURES =====
class SocialManager {
  
  // ===== ADD FRIEND =====
  async addFriend(userName, friendName) {
    try {
      await db.collection("friends").add({
        userId: userName,
        friendName,
        addedAt: new Date(),
        status: "pending"
      });
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  }

  // ===== GET FRIENDS =====
  async getFriends(userName) {
    try {
      const snapshot = await db.collection("friends")
        .where("userId", "==", userName)
        .where("status", "==", "accepted")
        .get();
      
      return snapshot.docs.map(doc => doc.data().friendName);
    } catch (error) {
      console.error("Error fetching friends:", error);
      return [];
    }
  }

  // ===== GET FRIENDS LEADERBOARD =====
  async getFriendsLeaderboard(userName) {
    try {
      const friends = await this.getFriends(userName);
      const leaderboard = [];

      for (const friend of friends) {
        const stats = await leaderboardManager.getUserStats(friend);
        if (stats) {
          leaderboard.push(stats);
        }
      }

      return leaderboard.sort((a, b) => b.totalDistance - a.totalDistance);
    } catch (error) {
      console.error("Error fetching friends leaderboard:", error);
      return [];
    }
  }

  // ===== SHARE RUN =====
  async shareRun(runId, runData) {
    try {
      const user = JSON.parse(localStorage.getItem("runnerUser"));
      
      await db.collection("shared_runs").add({
        userId: user.name,
        runId,
        distance: runData.distance,
        duration: runData.duration,
        date: new Date(),
        shareLink: this.generateShareLink(runId)
      });
    } catch (error) {
      console.error("Error sharing run:", error);
    }
  }

  // ===== GENERATE SHARE LINK =====
  generateShareLink(runId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}?share=${runId}`;
  }

  // ===== CREATE CHALLENGE =====
  async createChallenge(challengeType, duration, description) {
    try {
      const user = JSON.parse(localStorage.getItem("runnerUser"));
      
      const challengeId = Date.now().toString();
      await db.collection("challenges").doc(challengeId).set({
        creatorId: user.name,
        type: challengeType, // 'distance', 'zones', 'speed', 'time'
        duration, // in days
        description,
        startDate: new Date(),
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        participants: [user.name],
        createdAt: new Date()
      });

      return challengeId;
    } catch (error) {
      console.error("Error creating challenge:", error);
    }
  }

  // ===== JOIN CHALLENGE =====
  async joinChallenge(challengeId) {
    try {
      const user = JSON.parse(localStorage.getItem("runnerUser"));
      
      await db.collection("challenges").doc(challengeId).update({
        participants: firebase.firestore.FieldValue.arrayUnion(user.name)
      });
    } catch (error) {
      console.error("Error joining challenge:", error);
    }
  }

  // ===== GET ACTIVE CHALLENGES =====
  async getActiveChallenges() {
    try {
      const now = new Date();
      const snapshot = await db.collection("challenges")
        .where("endDate", ">", now)
        .get();

      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching challenges:", error);
      return [];
    }
  }
}

// ===== MAP ENHANCEMENTS =====
class MapEnhancer {
  
  // ===== CREATE HEATMAP FROM RUNS =====
  static createRunHeatmap(map, runs) {
    const heatmapData = [];

    runs.forEach(run => {
      if (run.routePolyline && run.routePolyline.length > 0) {
        run.routePolyline.forEach(point => {
          heatmapData.push([point[0], point[1], 0.5]); // [lat, lng, intensity]
        });
      }
    });

    if (heatmapData.length === 0) return;

    // Using Leaflet.heat plugin
    L.heatLayer(heatmapData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.2
    }).addTo(map);
  }

  // ===== ADD COMPASS =====
  static addCompass(map) {
    const compass = L.control({ position: 'topright' });

    compass.onAdd = function(map) {
      const div = L.DomUtil.create('div', 'leaflet-compass');
      div.innerHTML = `
        <div style="
          width: 50px;
          height: 50px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          cursor: pointer;
          border: 2px solid #667eea;
        " onclick="resetMapNorth()">
          🧭
        </div>
      `;
      return div;
    };

    compass.addTo(map);
  }

  // ===== ADD SPEED INDICATOR =====
  static createSpeedIndicator() {
    const speedometer = document.createElement('div');
    speedometer.id = 'speedometer';
    speedometer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      font-weight: bold;
      z-index: 999;
    `;
    speedometer.innerHTML = '<span id="speedValue">0 km/h</span>';
    document.body.appendChild(speedometer);
  }

  // ===== SHOW ZONE BOUNDARIES =====
  static highlightZoneBoundaries(map, zones) {
    zones.forEach(zone => {
      if (zone.coordinates && zone.coordinates.length > 0) {
        const bounds = L.latLngBounds(
          zone.coordinates.map(c => [c.lat, c.lng])
        );
        
        // Draw bounding box
        L.rectangle(bounds, {
          color: zone.color,
          weight: 3,
          fillOpacity: 0.1,
          dashArray: '5, 5'
        }).addTo(map);
      }
    });
  }
}

// Initialize managers
const runReplayManager = new RunReplayManager();
const antiCheatValidator = new AntiCheatValidator();
const socialManager = new SocialManager();

function resetMapNorth() {
  if (window.userMap) {
    window.userMap.setBearing(0);
  } else if (window.map) {
    window.map.setBearing(0);
  }
}
