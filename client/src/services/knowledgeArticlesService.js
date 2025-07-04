import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    startAfter
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';

class KnowledgeArticlesService {
    constructor() {
        this.db = db;
    }

    // Helper to get current user or throw
    getCurrentUserOrThrow() {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to perform this action.');
        }
        return user;
    }

    // Create a new knowledge article with the new structure
    async createArticle(articleData) {
        try {
            this.getCurrentUserOrThrow(); // Ensure user is authenticated

            const {
                title,
                description,
                category,
                readTime,
                views = 0,
                featured = false,
                content
            } = articleData;

            if (!title || !description || !content) {
                throw new Error('Missing required fields: title, description, and content are required');
            }

            const newArticle = {
                // Firestore will auto-generate the doc id, but we can store a custom id if needed
                title,
                description,
                category,
                readTime,
                views,
                featured,
                content,
                type: 'knowledge_article',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(this.db, 'posts'), newArticle);
            return docRef.id;
        } catch (error) {
            console.error('Error creating article:', error);
            throw error;
        }
    }

    // Get article by ID
    async getArticleById(articleId) {
        try {
            const docRef = doc(this.db, 'posts', articleId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().type === 'knowledge_article') {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                    time: docSnap.data().createdAt?.toDate?.() || new Date()
                };
            } else {
                throw new Error('Article not found');
            }
        } catch (error) {
            console.error('Error fetching article:', error);
            throw error;
        }
    }

    // List articles: fetch all, then filter client-side for knowledge_article type and options
    async listArticles(options = {}) {
        try {
            const {
                sortBy = 'newest',
                limitCount = 100,
                category = null,
                featured = null,
                lastDoc = null
            } = options;

            let q = collection(this.db, 'posts');

            // Only add orderBy and limit for now (no where filters)
            switch (sortBy) {
                case 'most_viewed':
                    q = query(q, orderBy('views', 'desc'), orderBy('createdAt', 'desc'));
                    break;
                default:
                    q = query(q, orderBy('createdAt', 'desc'));
            }

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }
            q = query(q, limit(limitCount));

            const snapshot = await getDocs(q);
            let articles = [];

            snapshot.forEach((doc) => {
                articles.push({
                    id: doc.id,
                    ...doc.data(),
                    time: doc.data().createdAt?.toDate?.() || new Date()
                });
            });

            // Client-side filter for knowledge_article type
            articles = articles.filter(article => article.type === 'knowledge_article');

            // Client-side filter for category
            if (category && category !== 'all') {
                articles = articles.filter(article => article.category === category);
            }

            // Client-side filter for featured
            if (featured !== null) {
                articles = articles.filter(article => article.featured === featured);
            }

            return {
                articles,
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === limitCount
            };
        } catch (error) {
            console.error('Error listing articles:', error);
            throw error;
        }
    }

    // Helper function to clean data and remove undefined values
    cleanData(data) {
        if (data === null || data === undefined) {
            return null;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.cleanData(item)).filter(item => item !== undefined);
        }

        if (typeof data === 'object' && data !== null) {
            const cleaned = {};
            for (const [key, value] of Object.entries(data)) {
                if (value !== undefined) {
                    const cleanedValue = this.cleanData(value);
                    if (cleanedValue !== undefined) {
                        cleaned[key] = cleanedValue;
                    }
                }
            }
            return cleaned;
        }

        return data;
    }
}

const knowledgeArticlesServiceInstance = new KnowledgeArticlesService();
export default knowledgeArticlesServiceInstance;