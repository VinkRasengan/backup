/**
 * FactCheck Cloud Functions
 *
 * This file contains Firebase Cloud Functions for the FactCheck application.
 * Functions include user management, link processing, and automated tasks.
 */

const {onRequest, onCall} = require("firebase-functions/v2/https");
const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const express = require("express");
const openaiService = require("./services/openaiService");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// CORS configuration
const cors = require("cors")({
  origin: true,
  credentials: true
});

// Create Express app for API
const app = express();
app.use(cors);
app.use(express.json());

// Firebase Auth middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      userId: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Auth routes - Firebase Auth handles authentication
app.post("/auth/register", async (req, res) => {
  try {
    const { idToken, firstName, lastName } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Firebase ID token required" });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if user already exists
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();

    if (userDoc.exists) {
      return res.status(400).json({ error: "User already registered" });
    }

    // Create user document
    const userData = {
      email: decodedToken.email,
      firstName: firstName || decodedToken.name?.split(" ")[0] || "",
      lastName: lastName || decodedToken.name?.split(" ")[1] || "",
      isVerified: decodedToken.email_verified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        linksChecked: 0
      }
    };

    await db.collection("users").doc(decodedToken.uid).set(userData);

    res.status(201).json({
      message: "User data synced successfully",
      userId: decodedToken.uid
    });

  } catch (error) {
    logger.error("Registration sync error:", error);
    res.status(500).json({ error: "Registration sync failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Firebase ID token required" });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Get or create user document
    let userDoc = await db.collection("users").doc(decodedToken.uid).get();
    let userData;

    if (userDoc.exists) {
      userData = userDoc.data();
      // Update last login
      await userDoc.ref.update({
        lastLoginAt: new Date().toISOString()
      });
    } else {
      // Create user document if it doesn't exist
      userData = {
        email: decodedToken.email,
        firstName: decodedToken.name?.split(" ")[0] || "",
        lastName: decodedToken.name?.split(" ")[1] || "",
        isVerified: decodedToken.email_verified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        stats: {
          linksChecked: 0
        }
      };

      await db.collection("users").doc(decodedToken.uid).set(userData);
    }

    res.json({
      message: "Login successful",
      user: {
        id: decodedToken.uid,
        ...userData
      }
    });
  } catch (error) {
    logger.error("Login sync error:", error);
    res.status(500).json({ error: "Login sync failed" });
  }
});

// Link routes
app.post("/links/check", authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;

    // Simple URL validation
    if (!url || !url.startsWith("http")) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    // Mock fact-check result
    const result = {
      url,
      userId: req.user.userId,
      status: "completed",
      credibilityScore: Math.floor(Math.random() * 100),
      summary: "This is a demo fact-check result. In production, this would contain real analysis.",
      sources: [
        { name: "Demo Source 1", url: "https://example.com/source1", credibility: "high" },
        { name: "Demo Source 2", url: "https://example.com/source2", credibility: "medium" }
      ],
      checkedAt: new Date().toISOString()
    };

    // Save to database
    const linkRef = await db.collection("links").add(result);

    res.json({
      id: linkRef.id,
      ...result
    });

  } catch (error) {
    logger.error("Link check error:", error);
    res.status(500).json({ error: "Failed to check link" });
  }
});

app.get("/links/history", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const linksQuery = await db.collection("links")
      .where("userId", "==", req.user.userId)
      .orderBy("checkedAt", "desc")
      .limit(parseInt(limit))
      .get();

    const links = linksQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      links,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: links.length
      }
    });

  } catch (error) {
    logger.error("History error:", error);
    res.status(500).json({ error: "Failed to get history" });
  }
});

// User routes
app.get("/users/profile", authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const { password, ...userProfile } = userData;

    res.json({
      id: userDoc.id,
      ...userProfile
    });

  } catch (error) {
    logger.error("Profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

app.get("/users/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    logger.info('🔄 Fetching dashboard data', {
      userId,
      timestamp: new Date().toISOString()
    });

    // Get user stats
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      logger.error('❌ User data not found', {
        userId,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({ error: "User data not found" });
    }

    logger.info('📊 User stats retrieved', {
      userId,
      stats: userData.stats,
      timestamp: new Date().toISOString()
    });

    // Get recent links
    const recentLinksQuery = await db.collection("links")
      .where("userId", "==", userId)
      .orderBy("checkedAt", "desc")
      .limit(5)
      .get();

    const recentLinks = recentLinksQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    logger.info('🔗 Recent links retrieved', {
      userId,
      linkCount: recentLinks.length,
      timestamp: new Date().toISOString()
    });

    res.json({
      stats: userData.stats || { linksChecked: 0 },
      recentLinks
    });

  } catch (error) {
    logger.error('❌ Dashboard error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: "Failed to get dashboard" });
  }
});

// Chat routes
app.get("/chat/starters", (req, res) => {
  try {
    const starters = openaiService.getConversationStarters();
    res.json({ starters });
  } catch (error) {
    logger.error("Get starters error:", error);
    res.status(500).json({ error: "Không thể tải danh sách câu hỏi gợi ý" });
  }
});

app.get("/chat/conversations", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const conversationsQuery = await db.collection("conversations")
      .where("userId", "==", req.user.userId)
      .orderBy("updatedAt", "desc")
      .limit(parseInt(limit))
      .get();

    const conversations = conversationsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      conversations,
      pagination: {
        currentPage: parseInt(page),
        totalCount: conversations.length,
        hasNext: false,
        hasPrev: false
      }
    });

  } catch (error) {
    logger.error("Get conversations error:", error);
    res.status(500).json({ error: "Không thể tải danh sách cuộc trò chuyện" });
  }
});

app.post("/chat/message", authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    logger.info('Processing chat message', {
      userId,
      messageLength: message?.length || 0
    });

    // Validate message using OpenAI service
    const validation = openaiService.validateMessage(message);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        code: 'INVALID_MESSAGE'
      });
    }

    // Send message directly to OpenAI (simplified version)
    logger.info('Sending message to OpenAI service', {
      userId,
      messageLength: validation.message.length
    });

    const aiResponse = await openaiService.sendMessage(validation.message, []);

    if (!aiResponse.success) {
      return res.status(500).json({
        error: aiResponse.error,
        code: 'AI_SERVICE_ERROR'
      });
    }

    logger.info('Message processed successfully', {
      userId,
      model: aiResponse.model,
      usage: aiResponse.usage
    });

    // Return simplified response format
    res.json({
      message: 'Tin nhắn đã được gửi thành công',
      response: {
        content: aiResponse.message,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error("Send message error:", error);
    res.status(500).json({ error: "Không thể gửi tin nhắn" });
  }
});



// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "FactCheck API"
  });
});

// Export API function
exports.api = onRequest({
  cors: true,
  region: "us-central1"
}, app);

/**
 * HTTP Function: Health Check
 * Simple health check endpoint for monitoring
 */
exports.healthCheck = onRequest({
  cors: true,
  region: "us-central1"
}, (request, response) => {
  logger.info("Health check requested");
  response.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "FactCheck Functions"
  });
});

/**
 * Firestore Trigger: Update user stats when a link is checked
 * Automatically updates user statistics when a new link is added
 */
exports.updateUserStats = onDocumentCreated({
  document: "links/{linkId}",
  region: "us-central1"
}, async (event) => {
  try {
    const linkData = event.data.data();
    const userId = linkData.userId;
    const linkId = event.params.linkId;

    logger.info('🔄 Starting updateUserStats', {
      linkId,
      userId,
      timestamp: new Date().toISOString()
    });

    // Get user document
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      logger.error('❌ User not found', {
        userId,
        linkId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const userData = userDoc.data();
    logger.info('📊 Current user stats', {
      userId,
      currentStats: userData.stats,
      timestamp: new Date().toISOString()
    });

    // Update user stats
    await userRef.update({
      "stats.linksChecked": admin.firestore.FieldValue.increment(1),
      "updatedAt": new Date().toISOString()
    });

    logger.info('✅ Successfully updated user stats', {
      userId,
      linkId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Error updating user stats:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Scheduled Function: Clean up expired tokens
 * Runs daily to remove expired verification and password reset tokens
 */
exports.cleanupExpiredTokens = onSchedule({
  schedule: "0 2 * * *", // Run daily at 2 AM
  timeZone: "UTC",
  region: "us-central1"
}, async (event) => {
  try {
    logger.info("Starting cleanup of expired tokens");

    const now = new Date();
    const batch = db.batch();
    let deletedCount = 0;

    // Clean up verification tokens
    const expiredVerificationTokens = await db.collection("verification_tokens")
      .where("expiresAt", "<", now.toISOString())
      .get();

    expiredVerificationTokens.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    // Clean up password reset tokens
    const expiredResetTokens = await db.collection("password_reset_tokens")
      .where("expiresAt", "<", now.toISOString())
      .get();

    expiredResetTokens.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    // Execute batch delete
    await batch.commit();

    logger.info(`Cleanup completed. Deleted ${deletedCount} expired tokens`);
  } catch (error) {
    logger.error("Error during token cleanup:", error);
  }
});
