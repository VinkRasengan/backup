const express = require('express');
const router = express.Router();
const firebaseConfig = require('../config/firebase-config');

// Initialize Firestore
let db = null;
firebaseConfig.initialize().then(firestore => {
    db = firestore;
}).catch(error => {
    console.error('Knowledge routes: Failed to initialize Firestore:', error);
});

/**
 * @route GET /api/knowledge
 * @desc Get all knowledge base articles
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const { category, featured, limit = 20 } = req.query;

        // Base query
        let query = db.collection('knowledge');

        // Filter by category if specified
        if (category && category !== 'all') {
            query = query.where('category', '==', category);
        }

        // Filter by featured if specified
        if (featured === 'true') {
            query = query.where('featured', '==', true);
        }

        // Get documents
        const snapshot = await query.get();
        let articles = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            articles.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            });
        });

        // Sort by featured first, then by creation date
        articles.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Apply limit
        articles = articles.slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                articles,
                count: articles.length,
                categories: ['basics', 'security', 'tools', 'advanced']
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get knowledge articles error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch knowledge articles',
            message: error.message
        });
    }
});

/**
 * @route GET /api/knowledge/:id
 * @desc Get single knowledge article by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const { id } = req.params;
        const doc = await db.collection('knowledge').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Article not found'
            });
        }

        const data = doc.data();
        
        // Increment view count
        await db.collection('knowledge').doc(id).update({
            views: (data.views || 0) + 1,
            updatedAt: new Date()
        });

        const article = {
            id: doc.id,
            ...data,
            views: (data.views || 0) + 1,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            data: article,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get knowledge article error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch knowledge article',
            message: error.message
        });
    }
});

/**
 * @route GET /api/knowledge/categories/stats
 * @desc Get knowledge base statistics by category
 * @access Public
 */
router.get('/categories/stats', async (req, res) => {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const snapshot = await db.collection('knowledge').get();
        const stats = {
            total: 0,
            categories: {},
            featured: 0,
            totalViews: 0
        };

        snapshot.forEach(doc => {
            const data = doc.data();
            stats.total++;
            
            if (data.featured) {
                stats.featured++;
            }
            
            stats.totalViews += data.views || 0;
            
            const category = data.category || 'uncategorized';
            if (!stats.categories[category]) {
                stats.categories[category] = {
                    count: 0,
                    views: 0
                };
            }
            stats.categories[category].count++;
            stats.categories[category].views += data.views || 0;
        });

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get knowledge stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch knowledge statistics',
            message: error.message
        });
    }
});

module.exports = router;
