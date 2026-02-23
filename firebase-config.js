// Firebase Configuration
// Replace these with your actual Firebase credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== ZONE MANAGEMENT =====
class ZoneManager {
  
  // Save zone to database
  async saveZone(ownerName, latlngs, distance, captureDate) {
    try {
      const zoneId = Date.now().toString();
      const zoneData = {
        zoneId,
        ownerName,
        coordinates: latlngs.map(point => ({ lat: point[0], lng: point[1] })),
        distance,
        captureDate,
        color: this.getColorByOwner(ownerName),
        status: "active",
        attackCount: 0,
        createdAt: new Date()
      };
      
      await db.collection("zones").doc(zoneId).set(zoneData);
      return zoneId;
    } catch (error) {
      console.error("Error saving zone:", error);
      throw error;
    }
  }

  // Get all zones for map display
  async getAllZones() {
    try {
      const snapshot = await db.collection("zones").get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching zones:", error);
      return [];
    }
  }

  // Get zone by ID
  async getZoneById(zoneId) {
    try {
      const doc = await db.collection("zones").doc(zoneId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error("Error fetching zone:", error);
      return null;
    }
  }

  // Update zone ownership (zone battle)
  async captureZone(zoneId, newOwnerName, distance) {
    try {
      const zone = await this.getZoneById(zoneId);
      if (!zone) return false;

      // Check if new owner has more distance
      if (distance > zone.distance) {
        await db.collection("zones").doc(zoneId).update({
          ownerName: newOwnerName,
          distance,
          captureDate: new Date(),
          attackCount: (zone.attackCount || 0) + 1,
          color: this.getColorByOwner(newOwnerName)
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error capturing zone:", error);
      return false;
    }
  }

  // Get zones owned by user
  async getUserZones(userName) {
    try {
      const snapshot = await db.collection("zones")
        .where("ownerName", "==", userName)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching user zones:", error);
      return [];
    }
  }

  // Generate color by owner (consistent)
  getColorByOwner(ownerName) {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"];
    let hash = 0;
    for (let i = 0; i < ownerName.length; i++) {
      hash = ownerName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}

// ===== LEADERBOARD MANAGEMENT =====
class LeaderboardManager {
  
  // Save run to database
  async saveRun(userName, distance, duration, routePolyline) {
    try {
      const runData = {
        userId: auth.currentUser?.uid || "anonymous",
        userName,
        distance,
        duration,
        routePolyline,
        date: new Date(),
        pace: (duration / distance).toFixed(2), // min/km
        coordinates: routePolyline.map(point => ({ lat: point[0], lng: point[1] }))
      };
      
      await db.collection("runs").add(runData);
      
      // Update user stats
      await this.updateUserStats(userName, distance);
    } catch (error) {
      console.error("Error saving run:", error);
    }
  }

  // Update user statistics
  async updateUserStats(userName, distance) {
    try {
      const userRef = db.collection("users").doc(userName);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const currentStats = userDoc.data();
        await userRef.update({
          totalDistance: (currentStats.totalDistance || 0) + distance,
          totalRuns: (currentStats.totalRuns || 0) + 1,
          lastRun: new Date()
        });
      } else {
        await userRef.set({
          name: userName,
          totalDistance: distance,
          totalRuns: 1,
          zonesOwned: 0,
          lastRun: new Date(),
          joinedDate: new Date()
        });
      }
    } catch (error) {
      console.error("Error updating user stats:", error);
    }
  }

  // Get city leaderboard
  async getCityLeaderboard(city, limit = 10) {
    try {
      const snapshot = await db.collection("users")
        .where("city", "==", city)
        .orderBy("totalDistance", "desc")
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching city leaderboard:", error);
      return [];
    }
  }

  // Get global leaderboard
  async getGlobalLeaderboard(limit = 10) {
    try {
      const snapshot = await db.collection("users")
        .orderBy("totalDistance", "desc")
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching global leaderboard:", error);
      return [];
    }
  }

  // Get user stats
  async getUserStats(userName) {
    try {
      const doc = await db.collection("users").doc(userName).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return null;
    }
  }

  // Get user run history
  async getUserRunHistory(userName, limit = 20) {
    try {
      const snapshot = await db.collection("runs")
        .where("userName", "==", userName)
        .orderBy("date", "desc")
        .limit(limit)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching run history:", error);
      return [];
    }
  }
}

// Initialize managers
const zoneManager = new ZoneManager();
const leaderboardManager = new LeaderboardManager();
