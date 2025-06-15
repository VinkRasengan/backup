const express = require('express');
const router = express.Router();

// Mock posts endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    posts: [
      {
        id: '1',
        title: 'Suspicious website reported',
        content: 'Found this suspicious website that looks like a phishing attempt...',
        author: 'user@example.com',
        votes: 5,
        comments: 2,
        createdAt: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1
    }
  });
});

router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Post created successfully',
    post: {
      id: '2',
      title: req.body.title,
      content: req.body.content,
      author: 'user@example.com',
      votes: 0,
      comments: 0,
      createdAt: new Date().toISOString()
    }
  });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    post: {
      id: req.params.id,
      title: 'Suspicious website reported',
      content: 'Found this suspicious website that looks like a phishing attempt...',
      author: 'user@example.com',
      votes: 5,
      comments: 2,
      createdAt: new Date().toISOString()
    }
  });
});

module.exports = router;
