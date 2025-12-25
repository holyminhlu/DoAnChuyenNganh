const Post = require('../models/postModel');

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'eduShare_secret_key_2024';

const getAuthUserFromRequest = (req) => {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  const token = parts[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      user_id: decoded.user_id,
      role: decoded.role,
      userId: decoded.userId
    };
  } catch (e) {
    return null;
  }
};

// Get all posts (with pagination)
exports.getAllPosts = async (req, res) => {
  try {
    console.log('\n📋 ========== GET ALL POSTS ==========');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const includeDeleted = String(req.query.includeDeleted || '').toLowerCase() === 'true';

    console.log(`Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    const query = {};
    if (!includeDeleted) {
      query.is_deleted = { $ne: true };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    console.log(`✅ Found ${posts.length} posts (Total: ${total})`);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải bài viết',
      error: error.message
    });
  }
};

// Get single post by ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải bài viết',
      error: error.message
    });
  }
};

// Create new post
exports.createPost = async (req, res) => {
  try {
    console.log('\n📝 ========== CREATE POST REQUEST ==========');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { author, content, images } = req.body;

    // Validation - Author
    if (!author) {
      console.log('❌ Validation failed: Missing author');
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin tác giả'
      });
    }

    if (!author.userId || !author.name) {
      console.log('❌ Validation failed: Invalid author info', author);
      return res.status(400).json({
        success: false,
        message: 'Thông tin tác giả không hợp lệ (thiếu userId hoặc name)'
      });
    }

    // Validation - Content (allow empty if has images)
    const hasContent = content && content.trim().length > 0;
    const hasImages = images && images.length > 0;

    if (!hasContent && !hasImages) {
      console.log('❌ Validation failed: No content and no images');
      return res.status(400).json({
        success: false,
        message: 'Bài viết phải có nội dung hoặc ảnh'
      });
    }

    console.log('✅ Validation passed');
    console.log('Content:', content ? content.substring(0, 50) + '...' : 'empty');
    console.log('Images:', images ? images.length : 0);

    // Create post
    const newPost = new Post({
      author: {
        userId: author.userId,
        name: author.name,
        avatar: author.avatar || ''
      },
      content: content ? content.trim() : '',
      images: images || []
    });

    console.log('💾 Saving post to database...');
    await newPost.save();
    console.log('✅ Post saved successfully:', newPost._id);

    res.status(201).json({
      success: true,
      message: 'Đăng bài thành công',
      data: newPost
    });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng bài',
      error: error.message
    });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { content, images } = req.body;
    const userId = req.body.userId; // From auth middleware

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Check if user is the author
    if (post.author.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa bài viết này'
      });
    }

    // Update fields
    if (content) post.content = content;
    if (images !== undefined) post.images = images;
    post.updatedAt = Date.now();

    await post.save();

    res.json({
      success: true,
      message: 'Cập nhật bài viết thành công',
      data: post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật bài viết',
      error: error.message
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const authUser = getAuthUserFromRequest(req);
    const userIdFromClient = (req.body && req.body.userId) || req.query.userId || null;
    const requesterId = (authUser && (authUser.user_id || authUser.userId)) ? (authUser.user_id || authUser.userId) : userIdFromClient;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Admin can delete any post
    if (authUser && authUser.role === 'admin') {
      // allowed
    } else {
      if (!requesterId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu userId để xác thực quyền xóa bài viết'
        });
      }
      if (post.author.userId !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa bài viết này'
        });
      }
    }

    // Soft delete
    post.is_deleted = true;
    post.deletedAt = new Date();
    post.updatedAt = Date.now();
    await post.save();

    res.json({
      success: true,
      message: 'Xóa bài viết (xóa mềm) thành công',
      is_deleted: post.is_deleted
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bài viết',
      error: error.message
    });
  }
};

// Restore soft-deleted post
exports.restorePost = async (req, res) => {
  try {
    const authUser = getAuthUserFromRequest(req);
    const userIdFromClient = (req.body && req.body.userId) || req.query.userId || null;
    const requesterId = (authUser && (authUser.user_id || authUser.userId)) ? (authUser.user_id || authUser.userId) : userIdFromClient;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Admin can restore any post
    if (authUser && authUser.role === 'admin') {
      // allowed
    } else {
      if (!requesterId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu userId để xác thực quyền khôi phục bài viết'
        });
      }
      if (post.author.userId !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền khôi phục bài viết này'
        });
      }
    }

    post.is_deleted = false;
    post.deletedAt = null;
    post.updatedAt = Date.now();
    await post.save();

    return res.json({
      success: true,
      message: 'Khôi phục bài viết thành công',
      is_deleted: post.is_deleted
    });
  } catch (error) {
    console.error('Error restoring post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi khôi phục bài viết',
      error: error.message
    });
  }
};

// Permanently delete post (destructive)
exports.deletePostPermanent = async (req, res) => {
  try {
    const force = String(req.query.force || '').toLowerCase() === 'true';
    if (!force) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu xác nhận xóa vĩnh viễn. Thêm ?force=true để thực hiện.'
      });
    }

    const authUser = getAuthUserFromRequest(req);
    const userIdFromClient = (req.body && req.body.userId) || req.query.userId || null;
    const requesterId = (authUser && (authUser.user_id || authUser.userId)) ? (authUser.user_id || authUser.userId) : userIdFromClient;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Admin can delete any post
    if (authUser && authUser.role === 'admin') {
      // allowed
    } else {
      if (!requesterId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu userId để xác thực quyền xóa bài viết'
        });
      }
      if (post.author.userId !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa bài viết này'
        });
      }
    }

    // Best-effort delete local images if they are stored under /uploads/images
    // We do not fail the request if file deletion fails.
    try {
      const path = require('path');
      const fsp = require('fs/promises');
      const images = Array.isArray(post.images) ? post.images : [];

      for (const img of images) {
        if (typeof img !== 'string') continue;
        const match = img.match(/\/uploads\/images\/([^?#]+)/);
        if (!match) continue;
        const fileName = match[1];
        const diskPath = path.join(__dirname, '..', 'uploads', 'images', fileName);
        try {
          await fsp.unlink(diskPath);
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Xóa vĩnh viễn bài viết thành công'
    });
  } catch (error) {
    console.error('Error permanently deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa vĩnh viễn bài viết',
      error: error.message
    });
  }
};

// Toggle like on post
exports.toggleLike = async (req, res) => {
  try {
    const { userId, userName } = req.body;

    if (!userId || !userName) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người dùng'
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Check if user already liked
    const likeIndex = post.likes.findIndex(like => like.userId === userId);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push({
        userId,
        name: userName,
        likedAt: new Date()
      });
    }

    await post.save();

    res.json({
      success: true,
      message: likeIndex > -1 ? 'Đã bỏ thích' : 'Đã thích bài viết',
      data: {
        liked: likeIndex === -1,
        likesCount: post.likes.length,
        likes: post.likes
      }
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thích bài viết',
      error: error.message
    });
  }
};

// Add comment to post
exports.addComment = async (req, res) => {
  try {
    const { author, content } = req.body;

    if (!author || !author.userId || !author.name) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin tác giả không hợp lệ'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được để trống'
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const newComment = {
      author: {
        userId: author.userId,
        name: author.name,
        avatar: author.avatar || ''
      },
      content: content.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    res.status(201).json({
      success: true,
      message: 'Đã thêm bình luận',
      data: {
        comment: post.comments[post.comments.length - 1],
        commentsCount: post.comments.length
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm bình luận',
      error: error.message
    });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.body.userId; // From auth middleware or request

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    // Check if user is the comment author or post author
    if (comment.author.userId !== userId && post.author.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bình luận này'
      });
    }

    comment.remove();
    await post.save();

    res.json({
      success: true,
      message: 'Đã xóa bình luận',
      data: {
        commentsCount: post.comments.length
      }
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bình luận',
      error: error.message
    });
  }
};

// Upload image
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được upload'
      });
    }

    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Upload ảnh thành công',
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload ảnh',
      error: error.message
    });
  }
};

