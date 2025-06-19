// Vote Service - Handle vote persistence and prevent duplicate voting
class VoteService {
  constructor() {
    this.storageKey = 'factcheck_votes';
    this.apiBaseUrl = '/api/community';
  }

  // Get user's vote history from localStorage
  getUserVotes() {
    try {
      const votes = localStorage.getItem(this.storageKey);
      return votes ? JSON.parse(votes) : {};
    } catch (error) {
      console.error('Error reading votes from localStorage:', error);
      return {};
    }
  }

  // Save user's vote to localStorage
  saveUserVote(postId, voteType) {
    try {
      const votes = this.getUserVotes();
      votes[postId] = {
        type: voteType, // 'upvote', 'downvote', or null
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(votes));
      return true;
    } catch (error) {
      console.error('Error saving vote to localStorage:', error);
      return false;
    }
  }

  // Get user's vote for a specific post
  getUserVoteForPost(postId) {
    const votes = this.getUserVotes();
    return votes[postId] || null;
  }

  // Check if user has already voted on a post
  hasUserVoted(postId) {
    const vote = this.getUserVoteForPost(postId);
    return vote && vote.type;
  }

  // Submit vote to backend API
  async submitVote(postId, voteType) {
    try {
      const currentVote = this.getUserVoteForPost(postId);

      // If user is trying to vote the same way again, remove the vote
      if (currentVote && currentVote.type === voteType) {
        voteType = null; // Remove vote
      }

      const response = await fetch(`${this.apiBaseUrl}/votes/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voteType,
          userId: this.getUserId() // Get user ID from auth context
        })
      });

      if (!response.ok) {
        throw new Error(`Vote submission failed: ${response.status}`);
      }

      const result = await response.json();

      // Save vote to localStorage on successful API call
      // Save the actual vote type that was processed (could be null if removed)
      const finalVoteType = result.action === 'removed' ? null : voteType;
      this.saveUserVote(postId, finalVoteType);

      return {
        success: true,
        data: result,
        userVote: finalVoteType,
        action: result.action
      };
    } catch (error) {
      console.error('Error submitting vote:', error);
      return {
        success: false,
        error: error.message,
        userVote: this.getUserVoteForPost(postId)?.type || null
      };
    }
  }

  // Get user ID (placeholder - should integrate with auth system)
  getUserId() {
    // TODO: Get from auth context or user session
    // For now, generate a temporary user ID based on browser
    let userId = localStorage.getItem('temp_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('temp_user_id', userId);
    }
    return userId;
  }

  // Clear all votes (for testing or logout)
  clearAllVotes() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing votes:', error);
      return false;
    }
  }

  // Get vote statistics for a post
  async getVoteStats(postId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/votes/${postId}/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch vote stats: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error fetching vote stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sync local votes with server (for when user logs in)
  async syncVotes() {
    try {
      const localVotes = this.getUserVotes();
      const voteEntries = Object.entries(localVotes);
      
      if (voteEntries.length === 0) return { success: true };

      const response = await fetch(`${this.apiBaseUrl}/votes/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          votes: localVotes,
          userId: this.getUserId()
        })
      });

      if (!response.ok) {
        throw new Error(`Vote sync failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error syncing votes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const voteService = new VoteService();
export default voteService;
