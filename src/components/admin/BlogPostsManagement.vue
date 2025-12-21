<template>
  <div class="blog-posts-management">
    <div class="section-header">
      <h2>Quản lý bài viết</h2>
      <div class="header-actions">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Tìm kiếm bài viết..."
            class="search-input"
            @input="handleSearch"
          />
        </div>
        <button @click="showCreateForm = true" class="btn-create">Viết bài mới</button>
      </div>
    </div>

    <!-- Create/Edit Form -->
    <div v-if="showCreateForm || editingPost" class="post-form">
      <h3>{{ editingPost ? 'Chỉnh sửa bài viết' : 'Viết bài mới' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Tiêu đề * (Tối đa 200 ký tự)</label>
          <input 
            type="text" 
            v-model="postForm.title" 
            required 
            class="form-control"
            placeholder="Nhập tiêu đề bài viết"
            maxlength="200"
          />
          <small class="char-count">{{ postForm.title.length }}/200 ký tự</small>
        </div>
        <div class="form-group">
          <label>Mô tả * (Tối đa 500 ký tự)</label>
          <textarea 
            v-model="postForm.description" 
            required 
            class="form-control"
            rows="3"
            placeholder="Nhập mô tả ngắn gọn"
            maxlength="500"
          ></textarea>
          <small class="char-count">{{ postForm.description.length }}/500 ký tự</small>
        </div>
        <div class="form-group">
          <label>Ảnh đại diện (Thumbnail) *</label>
          <div class="thumbnail-upload-area">
            <input 
              type="file" 
              ref="thumbnailInput"
              accept="image/*"
              @change="handleThumbnailChange"
              class="thumbnail-input"
              id="thumbnail-upload"
            />
            <label for="thumbnail-upload" class="thumbnail-upload-label">
              <div v-if="!postForm.thumbnailPreview" class="thumbnail-placeholder">
                <span>📷 Chọn ảnh đại diện</span>
                <small>JPG, PNG (tối đa 5MB)</small>
              </div>
              <div v-else class="thumbnail-preview">
                <img :src="postForm.thumbnailPreview" alt="Thumbnail preview" />
                <button 
                  type="button" 
                  @click.stop="removeThumbnail"
                  class="btn-remove-thumbnail"
                >
                  ✕
                </button>
              </div>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Nội dung *</label>
          <div class="content-blocks">
            <div 
              v-for="(block, index) in postForm.contentBlocks" 
              :key="index" 
              class="content-block"
            >
              <div class="block-header">
                <span class="block-number">Nội dung {{ index + 1 }}</span>
                <button 
                  type="button" 
                  @click="removeBlock(index)" 
                  class="btn-remove-block"
                  v-if="postForm.contentBlocks.length > 1"
                >
                  ✕
                </button>
              </div>
              <textarea 
                v-model="block.text" 
                class="form-control block-text"
                rows="4"
                :placeholder="`Nhập nội dung ${index + 1}`"
              ></textarea>
              <div class="block-image">
                <label class="image-label">Chọn ảnh (tùy chọn)</label>
                <div class="image-upload-area">
                  <input 
                    type="file" 
                    :ref="`imageInput-${index}`"
                    accept="image/*"
                    @change="(e) => handleImageChange(e, index)"
                    class="image-input"
                    :id="`image-${index}`"
                  />
                  <label :for="`image-${index}`" class="image-upload-label">
                    <span v-if="!block.imagePreview">📷 Chọn ảnh</span>
                    <img v-else :src="block.imagePreview" alt="Preview" class="image-preview" />
                  </label>
                  <button 
                    v-if="block.imagePreview" 
                    type="button" 
                    @click="removeImage(index)"
                    class="btn-remove-image"
                  >
                    Xóa ảnh
                  </button>
                </div>
              </div>
            </div>
            <button 
              type="button" 
              @click="addBlock" 
              class="btn-add-block"
            >
              + Thêm nội dung
            </button>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Danh mục *</label>
            <select v-model="postForm.category" required class="form-control">
              <option value="">Chọn danh mục</option>
              <option value="Tài liệu học tập">Tài liệu học tập</option>
              <option value="Mẹo học tập">Mẹo học tập</option>
              <option value="Công nghệ / Lập trình">Công nghệ / Lập trình</option>
              <option value="Kinh nghiệm sinh viên">Kinh nghiệm sinh viên</option>
              <option value="Hướng dẫn sử dụng OLF">Hướng dẫn sử dụng OLF</option>
            </select>
          </div>
          <div class="form-group">
            <label>Trạng thái *</label>
            <select v-model="postForm.status" required class="form-control">
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Tags (phân cách bằng dấu phẩy)</label>
          <input 
            type="text" 
            v-model="postForm.tagsInput" 
            class="form-control"
            placeholder="tag1, tag2, tag3"
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-submit" :disabled="submitting">
            {{ submitting ? 'Đang lưu...' : (editingPost ? 'Cập nhật' : 'Đăng bài') }}
          </button>
          <button type="button" @click="cancelForm" class="btn-cancel">Hủy</button>
        </div>
      </form>
    </div>

    <!-- Posts List -->
    <div v-if="loading" class="loading">Đang tải...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <table class="data-table">
        <thead>
          <tr>
            <th>Tiêu đề</th>
            <th>Danh mục</th>
            <th>Trạng thái</th>
            <th>Lượt xem</th>
            <th>Ngày đăng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post._id || post.id">
            <td>{{ post.title }}</td>
            <td>{{ post.category }}</td>
            <td>
              <span :class="['status-badge', post.status]">
                {{ getStatusText(post.status) }}
              </span>
            </td>
            <td>{{ post.views || 0 }}</td>
            <td>{{ formatDate(post.publishedDate || post.createdAt) }}</td>
            <td>
              <button @click="editPost(post)" class="btn-action">Sửa</button>
              <button @click="deletePost(post)" class="btn-action btn-delete">Xóa</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="posts.length === 0" class="empty-state">
        Không có dữ liệu
      </div>
    </div>
  </div>
</template>

<script>
import { getAllBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from '@/utils/adminAPI.js'

export default {
  name: 'BlogPostsManagement',
  data() {
    return {
      posts: [],
      loading: false,
      error: '',
      searchQuery: '',
      showCreateForm: false,
      editingPost: null,
      submitting: false,
      postForm: {
        title: '',
        description: '',
        content: '',
        thumbnail: null,
        thumbnailPreview: null,
        contentBlocks: [
          {
            text: '',
            image: null,
            imagePreview: null
          }
        ],
        category: '',
        status: 'published',
        tagsInput: ''
      }
    }
  },
  mounted() {
    this.loadPosts()
  },
  methods: {
    async loadPosts() {
      this.loading = true
      this.error = ''
      
      try {
        const params = { limit: 100 }
        if (this.searchQuery) {
          params.search = this.searchQuery
        }
        
        const result = await getAllBlogPosts(params)
        if (result.success) {
          this.posts = result.data || []
        } else {
          this.error = result.message || 'Không thể tải danh sách bài viết'
        }
      } catch (error) {
        console.error('Error loading posts:', error)
        this.error = 'Có lỗi xảy ra khi tải dữ liệu'
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.loadPosts()
      }, 500)
    },
    editPost(post) {
      this.editingPost = post
      
      // Parse content blocks from existing content
      // If content is HTML or structured, parse it; otherwise create single block
      let contentBlocks = []
      if (post.contentBlocks && Array.isArray(post.contentBlocks)) {
        contentBlocks = post.contentBlocks.map(block => ({
          text: block.text || '',
          image: null,
          imagePreview: block.image || null
        }))
      } else if (post.content) {
        // Try to parse if content has structure, otherwise use as single block
        try {
          const parsed = JSON.parse(post.content)
          if (Array.isArray(parsed)) {
            contentBlocks = parsed.map(block => ({
              text: block.text || '',
              image: null,
              imagePreview: block.image || null
            }))
          } else {
            contentBlocks = [{
              text: post.content,
              image: null,
              imagePreview: null
            }]
          }
        } catch {
          // If not JSON, treat as plain text
          contentBlocks = [{
            text: post.content,
            image: null,
            imagePreview: null
          }]
        }
      } else {
        contentBlocks = [{
          text: '',
          image: null,
          imagePreview: null
        }]
      }
      
      this.postForm = {
        title: post.title,
        description: post.description,
        content: post.content,
        thumbnail: null,
        thumbnailPreview: post.coverImage || null,
        contentBlocks: contentBlocks,
        category: post.category,
        status: post.status,
        tagsInput: Array.isArray(post.tags) ? post.tags.join(', ') : ''
      }
      this.showCreateForm = true
    },
    cancelForm() {
      this.showCreateForm = false
      this.editingPost = null
      this.postForm = {
        title: '',
        description: '',
        content: '',
        thumbnail: null,
        thumbnailPreview: null,
        contentBlocks: [
          {
            text: '',
            image: null,
            imagePreview: null
          }
        ],
        category: '',
        status: 'published',
        tagsInput: ''
      }
    },
    addBlock() {
      this.postForm.contentBlocks.push({
        text: '',
        image: null,
        imagePreview: null
      })
    },
    removeBlock(index) {
      if (this.postForm.contentBlocks.length > 1) {
        this.postForm.contentBlocks.splice(index, 1)
      }
    },
    handleImageChange(event, index) {
      const file = event.target.files[0]
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Vui lòng chọn file ảnh')
          return
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Kích thước ảnh không được vượt quá 5MB')
          return
        }
        
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          this.postForm.contentBlocks[index].imagePreview = e.target.result
        }
        reader.readAsDataURL(file)
        
        // Store file for upload
        this.postForm.contentBlocks[index].image = file
      }
    },
    removeImage(index) {
      this.postForm.contentBlocks[index].image = null
      this.postForm.contentBlocks[index].imagePreview = null
      // Reset file input
      const input = this.$refs[`imageInput-${index}`]
      if (input && input[0]) {
        input[0].value = ''
      }
    },
    handleThumbnailChange(event) {
      const file = event.target.files[0]
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Vui lòng chọn file ảnh')
          return
        }
        
        // Validate file size (max 2MB for original)
        if (file.size > 2 * 1024 * 1024) {
          alert('Kích thước ảnh không được vượt quá 2MB')
          return
        }
        
        // Compress and resize image before converting to base64
        this.compressImage(file, (compressedBase64) => {
          this.postForm.thumbnailPreview = compressedBase64
        })
        
        // Store file for upload
        this.postForm.thumbnail = file
      }
    },
    compressImage(file, callback) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Calculate new dimensions (max 1200px width, maintain aspect ratio)
          const maxWidth = 1200
          const maxHeight = 800
          let width = img.width
          let height = img.height
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
          
          // Create canvas and compress
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with quality 0.8 (80% quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)
          
          // Check if compressed size is still too large (max 500KB base64)
          if (compressedBase64.length > 500 * 1024) {
            // Try with lower quality
            const lowerQuality = canvas.toDataURL('image/jpeg', 0.6)
            callback(lowerQuality)
          } else {
            callback(compressedBase64)
          }
        }
        img.onerror = () => {
          // Fallback to original if compression fails
          callback(e.target.result)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    },
    removeThumbnail() {
      this.postForm.thumbnail = null
      this.postForm.thumbnailPreview = null
      // Reset file input
      if (this.$refs.thumbnailInput) {
        this.$refs.thumbnailInput.value = ''
      }
    },
    async handleSubmit() {
      this.submitting = true
      
      try {
        const userFullName = localStorage.getItem('userFullName') || 'Admin'
        const userId = localStorage.getItem('userId') || ''
        const userAvatar = localStorage.getItem('userAvatar') || ''

        // Parse tags
        const tags = this.postForm.tagsInput
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)

        // Build content from blocks
        // For now, we'll combine text blocks and store structure as JSON
        const contentBlocks = this.postForm.contentBlocks.map(block => ({
          text: block.text,
          image: block.imagePreview // Store image URL/preview for now
        }))
        
        // Calculate reading time from all text blocks
        const allText = this.postForm.contentBlocks.map(b => b.text).join(' ')
        const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length
        const readingTime = Math.max(1, Math.ceil(wordCount / 200))
        
        // Store content as JSON string for structured data
        const content = JSON.stringify(contentBlocks)

        // Validate required fields
        if (!this.postForm.title || !this.postForm.description || !this.postForm.category) {
          alert('Vui lòng điền đầy đủ thông tin: Tiêu đề, Mô tả, Danh mục')
          this.submitting = false
          return
        }
        
        // Validate description length (max 500 characters)
        const description = this.postForm.description.trim()
        if (description.length > 500) {
          alert(`Mô tả quá dài (${description.length} ký tự). Vui lòng rút ngắn xuống tối đa 500 ký tự.`)
          this.submitting = false
          return
        }
        
        // Validate title length (max 200 characters based on model)
        const title = this.postForm.title.trim()
        if (title.length > 200) {
          alert(`Tiêu đề quá dài (${title.length} ký tự). Vui lòng rút ngắn xuống tối đa 200 ký tự.`)
          this.submitting = false
          return
        }

        // Validate content blocks
        const hasContent = this.postForm.contentBlocks.some(block => block.text && block.text.trim().length > 0)
        if (!hasContent) {
          alert('Vui lòng nhập ít nhất một nội dung')
          this.submitting = false
          return
        }

        // Validate coverImage size if it's base64 (max 500KB base64 after compression)
        let coverImageUrl = this.postForm.thumbnailPreview || ''
        if (coverImageUrl && coverImageUrl.length > 500 * 1024) {
          alert('Ảnh đại diện vẫn còn quá lớn sau khi nén. Vui lòng chọn ảnh nhỏ hơn hoặc ảnh có chất lượng thấp hơn.')
          this.submitting = false
          return
        }
        
        // If thumbnail is too large, use empty string instead
        if (coverImageUrl && coverImageUrl.length > 1024 * 1024) {
          console.warn('Thumbnail too large, using empty string')
          coverImageUrl = ''
        }

        const postData = {
          title: title,
          description: description, // Already trimmed and validated
          content: content, // Store structured content as JSON string
          coverImage: coverImageUrl,
          category: this.postForm.category,
          status: this.postForm.status,
          tags: tags,
          author: {
            id: userId,
            name: userFullName,
            avatar: userAvatar
          },
          readingTime: readingTime
        }

        let result
        if (this.editingPost) {
          const postId = this.editingPost._id || this.editingPost.id || this.editingPost.blog_post_id
          result = await updateBlogPost(postId, postData)
        } else {
          result = await createBlogPost(postData)
        }

        if (result.success) {
          this.cancelForm()
          this.loadPosts()
          alert(this.editingPost ? 'Cập nhật bài viết thành công!' : 'Đăng bài thành công!')
        } else {
          const errorMsg = result.message || result.error || 'Có lỗi xảy ra'
          console.error('Server error response:', result)
          if (result.errorDetails) {
            console.error('Error details:', result.errorDetails)
          }
          alert(`Lỗi: ${errorMsg}`)
        }
      } catch (error) {
        console.error('Error saving post:', error)
        console.error('Error response:', error.response)
        
        let errorMsg = 'Có lỗi xảy ra khi lưu bài viết'
        if (error.response?.data) {
          errorMsg = error.response.data.message || error.response.data.error || errorMsg
          if (error.response.data.errorDetails) {
            console.error('Error details:', error.response.data.errorDetails)
          }
        } else if (error.message) {
          errorMsg = error.message
        }
        
        alert(`Lỗi: ${errorMsg}`)
      } finally {
        this.submitting = false
      }
    },
    async deletePost(post) {
      if (!confirm(`Bạn có chắc muốn xóa bài viết "${post.title}"?`)) {
        return
      }

      try {
        const postId = post._id || post.id || post.blog_post_id
        const result = await deleteBlogPost(postId)
        
        if (result.success) {
          this.loadPosts()
        } else {
          alert(result.message || 'Có lỗi xảy ra')
        }
      } catch (error) {
        console.error('Error deleting post:', error)
        alert('Có lỗi xảy ra khi xóa')
      }
    },
    getStatusText(status) {
      const statusMap = {
        draft: 'Bản nháp',
        published: 'Đã xuất bản',
        archived: 'Đã lưu trữ'
      }
      return statusMap[status] || status
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('vi-VN')
    }
  }
}
</script>

<style scoped>
.blog-posts-management {
  background: white;
  padding: 30px;
  border-radius: 4px;
}

.section-header {
  margin-bottom: 30px;
}

.section-header h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: normal;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-create {
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-create:hover {
  background-color: #555;
}

.post-form {
  background: #f9f9f9;
  padding: 30px;
  border-radius: 4px;
  margin-bottom: 30px;
}

.post-form h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: normal;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #666;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-submit {
  padding: 10px 20px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-submit:hover:not(:disabled) {
  background-color: #555;
}

.btn-submit:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 10px 20px;
  background-color: #999;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel:hover {
  background-color: #777;
}

.loading, .error {
  padding: 20px;
  text-align: center;
  color: #666;
}

.error {
  color: #d32f2f;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
}

.data-table th {
  background-color: #f5f5f5;
  font-weight: 500;
  color: #333;
}

.data-table tr:hover {
  background-color: #f9f9f9;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.draft {
  background-color: #fff3e0;
  color: #e65100;
}

.status-badge.published {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.archived {
  background-color: #f5f5f5;
  color: #616161;
}

.btn-action {
  padding: 6px 12px;
  margin-right: 8px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-action:hover {
  background-color: #555;
}

.btn-delete {
  background-color: #d32f2f;
}

.btn-delete:hover {
  background-color: #b71c1c;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #999;
}

/* Content Blocks Styles */
.content-blocks {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-block {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.block-number {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.btn-remove-block {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.btn-remove-block:hover {
  background: #c82333;
}

.block-text {
  margin-bottom: 16px;
  min-height: 100px;
}

.block-image {
  margin-top: 12px;
}

.image-label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.image-upload-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-input {
  display: none;
}

.image-upload-label {
  display: inline-block;
  padding: 40px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  background: white;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-label:hover {
  border-color: #4f46e5;
  background: #f8f9ff;
}

.image-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
}

.btn-remove-image {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  align-self: flex-start;
}

.btn-remove-image:hover {
  background: #c82333;
}

.btn-add-block {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.btn-add-block:hover {
  background: #4338ca;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

/* Thumbnail Upload Styles */
.thumbnail-upload-area {
  margin-top: 8px;
}

.thumbnail-input {
  display: none;
}

.thumbnail-upload-label {
  display: block;
  cursor: pointer;
}

.thumbnail-placeholder {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
}

.thumbnail-placeholder:hover {
  border-color: #4f46e5;
  background: #f8f9ff;
}

.thumbnail-placeholder span {
  display: block;
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.thumbnail-placeholder small {
  display: block;
  font-size: 12px;
  color: #999;
}

.thumbnail-preview {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.thumbnail-preview img {
  display: block;
  max-width: 100%;
  max-height: 300px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.btn-remove-thumbnail {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s ease;
}

.btn-remove-thumbnail:hover {
  background: rgba(220, 53, 69, 1);
  transform: scale(1.1);
}

/* Character count */
.char-count {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  text-align: right;
}

.char-count:has(+ *) {
  margin-bottom: 0;
}
</style>

