import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class FirestoreService {
  constructor() {
    this.db = db;
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

  // Community Posts
  async getCommunityPosts(options = {}) {
    try {
      const {
        sortBy = 'newest',
        limitCount = 10,
        category = null,
        lastDoc = null
      } = options;

      let q = collection(this.db, 'links');

      // Add category filter if specified
      if (category && category !== 'all') {
        q = query(q, where('category', '==', category));
      }

      // Add sorting
      switch (sortBy) {
        case 'newest':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'trending':
          q = query(q, orderBy('voteCount', 'desc'), orderBy('createdAt', 'desc'));
          break;
        case 'most_voted':
          q = query(q, orderBy('voteCount', 'desc'));
          break;
        default:
          q = query(q, orderBy('createdAt', 'desc'));
      }

      // Add pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      q = query(q, limit(limitCount));

      const snapshot = await getDocs(q);
      const posts = [];
      
      snapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        });
      });

      return {
        posts,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error('Error fetching community posts:', error);
      throw error;
    }
  }

  // Get single post
  async getPostById(postId) {
    try {
      const docRef = doc(this.db, 'links', postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date()
        };
      } else {
        throw new Error('Post not found');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  // Create new post
  async createPost(postData, userId) {
    try {
      // Validate required fields
      if (!postData || !userId) {
        throw new Error('Missing required parameters: postData and userId are required');
      }

      // Clean the post data to remove undefined values
      const cleanedPostData = this.cleanData(postData);

      const newPost = {
        ...cleanedPostData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        voteCount: 0,
        commentCount: 0,
        status: cleanedPostData.status || 'active'
      };

      // Clean the final object before sending to Firestore
      const finalPost = this.cleanData(newPost);

      const docRef = await addDoc(collection(this.db, 'links'), finalPost);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Comments
  async getComments(linkId, options = {}) {
    try {
      const { limitCount = 10, lastDoc = null } = options;
      
      let q = query(
        collection(this.db, 'comments'),
        where('linkId', '==', linkId),
        orderBy('createdAt', 'desc')
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      q = query(q, limit(limitCount));

      const snapshot = await getDocs(q);
      const comments = [];
      
      snapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        });
      });

      return {
        comments,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      
      // Handle missing index error - try simpler query
      if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
        console.warn('Missing Firestore index. Trying simpler query without orderBy...');
        
        try {
          // Simpler query without orderBy
          let simpleQuery = query(
            collection(this.db, 'comments'),
            where('linkId', '==', linkId),
            limit(options.limitCount || 10)
          );

          const simpleSnapshot = await getDocs(simpleQuery);
          const comments = [];
          
          simpleSnapshot.forEach((doc) => {
            comments.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            });
          });

          // Sort manually since we can't use orderBy
          comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          return {
            comments,
            lastDoc: simpleSnapshot.docs[simpleSnapshot.docs.length - 1],
            hasMore: simpleSnapshot.docs.length === (options.limitCount || 10)
          };
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  // Add comment
  async addComment(linkId, content, userId, userEmail) {
    try {
      // Validate required fields
      if (!linkId || !content || !userId) {
        throw new Error('Missing required parameters: linkId, content, and userId are required');
      }

      console.log('🔍 Adding comment with data:', { linkId, content, userId, userEmail });

      const newComment = {
        linkId,
        content,
        userId,
        userEmail: userEmail || null, // Handle undefined userEmail
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Clean the comment data
      const cleanedComment = this.cleanData(newComment);
      console.log('📝 Cleaned comment data:', cleanedComment);

      // First, try to add the comment
      const docRef = await addDoc(collection(this.db, 'comments'), cleanedComment);
      console.log('✅ Comment added with ID:', docRef.id);
      
      // Then try to update comment count on the post
      try {
        const postRef = doc(this.db, 'links', linkId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const currentCount = postSnap.data().commentCount || 0;
          await updateDoc(postRef, {
            commentCount: currentCount + 1
          });
          console.log('✅ Comment count updated to:', currentCount + 1);
        } else {
          console.log('⚠️ Post not found in links collection, comment added but count not updated');
        }
      } catch (countError) {
        console.warn('⚠️ Failed to update comment count, but comment was added successfully:', countError);
        // Don't throw error here since the comment was already added successfully
      }

      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Votes
  async getUserVote(linkId, userId) {
    try {
      const q = query(
        collection(this.db, 'votes'),
        where('linkId', '==', linkId),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const voteDoc = snapshot.docs[0];
        return {
          id: voteDoc.id,
          ...voteDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user vote:', error);
      throw error;
    }
  }

  // Submit vote
  async submitVote(linkId, voteType, userId, userEmail) {
    // Validate required parameters
    if (!linkId || !voteType || !userId) {
      throw new Error('Missing required parameters: linkId, voteType, and userId are required');
    }

    try {
      // Check if user already voted
      const existingVote = await this.getUserVote(linkId, userId);
      
      if (existingVote) {
        // Update existing vote
        const voteRef = doc(this.db, 'votes', existingVote.id);
        await updateDoc(voteRef, {
          voteType,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new vote
        const newVote = {
          linkId,
          userId,
          userEmail: userEmail || null, // Handle undefined userEmail
          voteType,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Clean the vote data
        const cleanedVote = this.cleanData(newVote);
        await addDoc(collection(this.db, 'votes'), cleanedVote);
      }

      // Update vote count on the post
      await this.updatePostVoteCount(linkId);
      
      return true;
    } catch (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
  }

  // Update post vote count
  async updatePostVoteCount(linkId) {
    try {
      const q = query(
        collection(this.db, 'votes'),
        where('linkId', '==', linkId)
      );

      const snapshot = await getDocs(q);
      const voteCount = snapshot.size;

      const postRef = doc(this.db, 'links', linkId);
      await updateDoc(postRef, {
        voteCount
      });

      return voteCount;
    } catch (error) {
      console.error('Error updating vote count:', error);
      throw error;
    }
  }

  // Get vote statistics
  async getVoteStats(linkId) {
    try {
      const q = query(
        collection(this.db, 'votes'),
        where('linkId', '==', linkId)
      );

      const snapshot = await getDocs(q);
      const stats = {
        total: 0,
        safe: 0,
        unsafe: 0,
        suspicious: 0
      };

      snapshot.forEach((doc) => {
        const voteType = doc.data().voteType;
        stats.total++;
        if (stats[voteType] !== undefined) {
          stats[voteType]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching vote stats:', error);
      throw error;
    }
  }
  // Knowledge Articles
  async createKnowledgeArticle(articleData) {
    try {
      const { title, shortDescription, category, isOnTop, body } = articleData;

      // Validate required fields
      if (!title || !shortDescription || !body) {
        throw new Error('Missing required parameters: title, shortDescription, and body are required');
      }

      const insertedTime = serverTimestamp();
      const id = encodeURIComponent(title + '-' + Date.now()); // Use title + timestamp for unique ID

      const newArticle = {
        id,
        title,
        shortDescription,
        time: insertedTime,
        category,
        isOnTop,
        body
      };

      const finalArticle = this.cleanData(newArticle);
      const docRef = await addDoc(collection(this.db, 'knowledgeArticles'), finalArticle);
      return docRef.id;
    } catch (error) {
      console.error('Error creating knowledge article:', error);
      throw error;
    }
  }

  async getKnowledgeArticleById(articleId) {
    try {
      const docRef = doc(this.db, 'knowledgeArticles', articleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          time: docSnap.data().time?.toDate?.() || new Date()
        };
      } else {
        throw new Error('Article not found');
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  }

  async listKnowledgeArticles(options = {}) {
    try {
      const { limitCount = 10, category = null, isOnTop = null } = options;

      let q = collection(this.db, 'knowledgeArticles');

      // Add category filter if specified
      if (category) {
        q = query(q, where('category', '==', category));
      }

      // Add isOnTop filter if specified
      if (isOnTop !== null) {
        q = query(q, where('isOnTop', '==', isOnTop));
      }

      q = query(q, orderBy('time', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      const articles = [];
      
      snapshot.forEach((doc) => {
        articles.push({
          id: doc.id,
          ...doc.data(),
          time: doc.data().time?.toDate?.() || new Date()
        });
      });

      return articles;
    } catch (error) {
      console.error('Error fetching knowledge articles:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToComments(linkId, callback) {
    try {
      const q = query(
        collection(this.db, 'comments'),
        where('linkId', '==', linkId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      return onSnapshot(q, 
        (snapshot) => {
          const comments = [];
          snapshot.forEach((doc) => {
            comments.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            });
          });
          callback(comments);
        },
        (error) => {
          console.error('Firestore subscription error:', error);
          
          // Handle missing index error specifically
          if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
            console.warn('Missing Firestore index for comments query. Falling back to simple query.');
            
            // Fallback: try a simpler query without orderBy
            const simpleQuery = query(
              collection(this.db, 'comments'),
              where('linkId', '==', linkId),
              limit(10)
            );
            
            return onSnapshot(simpleQuery, (snapshot) => {
              const comments = [];
              snapshot.forEach((doc) => {
                comments.push({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data().createdAt?.toDate?.() || new Date()
                });
              });
              // Sort manually since we can't use orderBy
              comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              callback(comments);
            });
          }
          
          throw error;
        }
      );
    } catch (error) {
      console.error('Error setting up comments subscription:', error);
      throw error;
    }
  }

  subscribeToVoteStats(linkId, callback) {
    const q = query(
      collection(this.db, 'votes'),
      where('linkId', '==', linkId)
    );

    return onSnapshot(q, (snapshot) => {
      const stats = {
        total: 0,
        safe: 0,
        unsafe: 0,
        suspicious: 0
      };

      snapshot.forEach((doc) => {
        const voteType = doc.data().voteType;
        stats.total++;
        if (stats[voteType] !== undefined) {
          stats[voteType]++;
        }
      });

      callback(stats);
    });
  }
}

const firestoreServiceInstance = new FirestoreService();
export default firestoreServiceInstance;
