const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const postController = require('../controllers/postController');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    cb(null, 'post_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Image upload - MUST be before /:id routes
router.post('/upload-image', upload.single('image'), postController.uploadImage);

// Routes
router.get('/', postController.getAllPosts);
router.patch('/:id/restore', postController.restorePost);
router.delete('/:id/permanent', postController.deletePostPermanent);
router.get('/:id', postController.getPostById);
router.post('/', postController.createPost);
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);

// Like/Unlike
router.post('/:id/like', postController.toggleLike);

// Comments
router.post('/:id/comments', postController.addComment);
router.delete('/:postId/comments/:commentId', postController.deleteComment);

module.exports = router;

