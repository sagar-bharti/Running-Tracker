// ===== NOTIFICATIONS SYSTEM =====
class NotificationManager {
  
  constructor() {
    this.notifications = [];
    this.setupNotificationListener();
  }

  // ===== PUSH NOTIFICATION =====
  addNotification(type, title, message, icon = "ℹ️") {
    const id = Date.now();
    const notification = {
      id,
      type, // 'danger', 'success', 'warning', 'info', 'attack', 'zone'
      title,
      message,
      icon,
      timestamp: new Date()
    };

    this.notifications.unshift(notification);
    this.showNotificationToast(notification);
    this.saveNotificationToDatabase(notification);

    return id;
  }

  // ===== SHOW TOAST NOTIFICATION =====
  showNotificationToast(notification) {
    const container = document.getElementById("notificationContainer");
    if (!container) {
      console.log("Notification:", notification.title);
      return;
    }

    const toast = document.createElement("div");
    toast.className = `notification-toast notification-${notification.type}`;
    toast.innerHTML = `
      <div class="notification-icon">${notification.icon}</div>
      <div class="notification-content">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  // ===== SAVE TO DATABASE =====
  async saveNotificationToDatabase(notification) {
    try {
      const user = JSON.parse(localStorage.getItem("runnerUser"));
      if (!user) return;

      await db.collection("notifications").add({
        userId: user.name,
        ...notification,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  }

  // ===== ZONE ATTACK NOTIFICATION =====
  notifyZoneAttack(attacker, zoneSize) {
    this.addNotification(
      "danger",
      "⚔️ Zone Under Attack!",
      `${attacker} is attacking your ${zoneSize.toFixed(2)} km zone!`,
      "⚔️"
    );
  }

  // ===== ZONE LOST NOTIFICATION =====
  notifyZoneLost(newOwner, zoneSize) {
    this.addNotification(
      "danger",
      "👑 Crown Lost!",
      `${newOwner} captured your ${zoneSize.toFixed(2)} km zone!`,
      "👑"
    );
  }

  // ===== PERSONAL BEST NOTIFICATION =====
  notifyPersonalBest(distance) {
    this.addNotification(
      "success",
      "🏆 Personal Best!",
      `You ran ${distance.toFixed(2)} km - New personal best!`,
      "🏆"
    );
  }

  // ===== ZONE CAPTURED NOTIFICATION =====
  notifyZoneCaptured(distance) {
    this.addNotification(
      "success",
      "✅ Zone Captured!",
      `You captured a ${distance.toFixed(2)} km zone!`,
      "✅"
    );
  }

  // ===== ACHIEVEMENT UNLOCKED =====
  notifyAchievement(badge, description) {
    this.addNotification(
      "success",
      `🏅 Achievement Unlocked!`,
      `${badge} ${description}`,
      "🏅"
    );
  }

  // ===== SETUP REAL-TIME LISTENER =====
  setupNotificationListener() {
    // Listen for real-time notifications from database
    const user = JSON.parse(localStorage.getItem("runnerUser"));
    if (!user) return;

    try {
      db.collection("notifications")
        .where("userId", "==", user.name)
        .orderBy("createdAt", "desc")
        .limit(10)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
              const doc = change.doc.data();
              // Only show if it's recent (last 10 seconds)
              const age = Date.now() - doc.createdAt.toMillis();
              if (age < 10000) {
                this.showNotificationToast(doc);
              }
            }
          });
        });
    } catch (error) {
      console.log("Real-time notifications not available (Firebase not ready)");
    }
  }

  // ===== GET USER NOTIFICATIONS =====
  async getUserNotifications(limit = 20) {
    try {
      const user = JSON.parse(localStorage.getItem("runnerUser"));
      if (!user) return [];

      const snapshot = await db.collection("notifications")
        .where("userId", "==", user.name)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  // ===== CLEAR OLD NOTIFICATIONS =====
  async clearOldNotifications(daysOld = 7) {
    try {
      const user = JSON.parse(localStorage.getItem("runnerUser"));
      if (!user) return;

      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const snapshot = await db.collection("notifications")
        .where("userId", "==", user.name)
        .where("createdAt", "<", cutoffDate)
        .get();

      snapshot.docs.forEach(doc => {
        doc.ref.delete();
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }
}

// Initialize notification manager
const notificationManager = new NotificationManager();

// ===== CHECK FOR ACHIEVEMENTS =====
class AchievementManager {
  
  constructor() {
    this.achievements = {
      first_run: {
        name: "First Run",
        icon: "🏃",
        condition: (stats) => stats.totalRuns >= 1,
        description: "Complete your first run"
      },
      five_km: {
        name: "5K Runner",
        icon: "🥉",
        condition: (stats) => stats.totalDistance >= 5,
        description: "Run a total of 5 km"
      },
      half_marathon: {
        name: "Half Marathon",
        icon: "🥈",
        condition: (stats) => stats.totalDistance >= 21.1,
        description: "Run a total of 21.1 km (half marathon distance)"
      },
      marathon: {
        name: "Marathon",
        icon: "🥇",
        condition: (stats) => stats.totalDistance >= 42.2,
        description: "Run a total of 42.2 km (marathon distance)"
      },
      zone_master: {
        name: "Zone Master",
        icon: "👑",
        condition: (stats, zones) => zones >= 5,
        description: "Capture 5 zones"
      },
      week_warrior: {
        name: "Week Warrior",
        icon: "🔥",
        condition: (stats) => stats.totalRuns >= 7,
        description: "Complete 7 runs"
      }
    };
  }

  // ===== CHECK & UNLOCK ACHIEVEMENTS =====
  async checkAchievements() {
    const user = JSON.parse(localStorage.getItem("runnerUser"));
    if (!user) return;

    try {
      const stats = await leaderboardManager.getUserStats(user.name);
      const zones = await zoneManager.getUserZones(user.name);

      const userAchievements = await this.getUserAchievements(user.name);
      const unlockedIds = userAchievements.map(a => a.id);

      for (const [id, achievement] of Object.entries(this.achievements)) {
        if (!unlockedIds.includes(id)) {
          const condition = achievement.condition(stats, zones?.length || 0);
          if (condition) {
            await this.unlockAchievement(user.name, id, achievement);
            notificationManager.notifyAchievement(
              achievement.icon,
              achievement.name
            );
          }
        }
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }

  // ===== UNLOCK ACHIEVEMENT =====
  async unlockAchievement(userName, id, achievement) {
    try {
      await db.collection("achievements").add({
        userId: userName,
        id,
        name: achievement.name,
        icon: achievement.icon,
        description: achievement.description,
        unlockedAt: new Date()
      });
    } catch (error) {
      console.error("Error unlocking achievement:", error);
    }
  }

  // ===== GET USER ACHIEVEMENTS =====
  async getUserAchievements(userName) {
    try {
      const snapshot = await db.collection("achievements")
        .where("userId", "==", userName)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }
  }
}

// Initialize achievement manager
const achievementManager = new AchievementManager();
