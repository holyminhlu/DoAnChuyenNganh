<template>
  <main class="blog-detail-page">
    <div class="container">
      <div v-if="loading" class="loading">Đang tải...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <article v-else-if="post" class="blog-post">
        <div class="post-header">
          <div class="chip">{{ post.category }}</div>
          <h1 class="post-title">{{ post.title }}</h1>
          <div class="post-meta">
            <span>✍️ {{ getAuthorName(post) }}</span>
            <span>· {{ formatDate(post.publishedDate) }}</span>
            <span>· 👁️ {{ post.views || 0 }} lượt xem</span>
            <span v-if="post.readingTime">· 📖 {{ post.readingTime }} phút đọc</span>
          </div>
          <div v-if="post.tags && post.tags.length > 0" class="post-tags">
            <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
        
        <div v-if="post.coverImage" class="post-cover">
          <img :src="post.coverImage" :alt="post.title" />
        </div>
        
        <div class="post-description">
          <p>{{ post.description }}</p>
        </div>
        
        <div class="post-content">
          <div v-if="post.contentBlocks && Array.isArray(post.contentBlocks)">
            <div 
              v-for="(block, index) in post.contentBlocks" 
              :key="index" 
              class="content-block"
            >
              <div class="block-text" v-html="formatText(block.text)"></div>
              <div v-if="block.image" class="block-image">
                <img :src="block.image" :alt="`Ảnh ${index + 1}`" />
              </div>
            </div>
          </div>
          <div v-else class="content-text" v-html="formatContent(post.content)"></div>
        </div>
      </article>
      
      <div class="back-link">
        <button @click="$router.push('/blog')" class="btn-back">← Quay lại danh sách</button>
      </div>
    </div>
  </main>
</template>

<script>
import { getPostById } from '@/utils/blogAPI'

export default {
  name: 'BlogDetail',
  data() {
    return {
      post: null,
      loading: true,
      error: null
    }
  },
  async mounted() {
    await this.loadPost()
  },
  watch: {
    '$route.params.slug'() {
      this.loadPost()
    }
  },
  methods: {
    async loadPost() {
      this.loading = true
      this.error = null
      
      try {
        const slug = this.$route.params.slug
        const response = await getPostById(slug)
        
        if (response.success && response.data) {
          this.post = response.data
        } else {
          this.error = 'Không tìm thấy bài viết'
        }
      } catch (error) {
        console.error('Error loading post:', error)
        this.error = 'Có lỗi xảy ra khi tải bài viết'
      } finally {
        this.loading = false
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    },
    getAuthorName(post) {
      if (typeof post.author === 'object' && post.author.name) {
        return post.author.name
      }
      return post.author || 'Admin'
    },
    formatText(text) {
      if (!text) return ''
      // Convert line breaks to <br>
      let formatted = text.replace(/\n/g, '<br>')
      // Replace any img tags with styled versions
      formatted = formatted.replace(/<img([^>]*)>/gi, (match, attrs) => {
        const styleAttr = 'style="max-width: 100%; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); object-fit: contain; display: block; margin: 20px auto;"'
        if (attrs.includes('style=')) {
          return match.replace(/style="[^"]*"/, styleAttr)
        } else {
          return `<img${attrs} ${styleAttr}>`
        }
      })
      return formatted
    },
    formatContent(content) {
      if (!content) return ''
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          return parsed.map((block, idx) => {
            let html = `<div class="content-block"><div class="block-text">${this.formatText(block.text)}</div>`
            if (block.image) {
              html += `<div class="block-image"><img src="${block.image}" alt="Ảnh ${idx + 1}" style="max-width: 100%; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); object-fit: contain; display: block; margin: 20px auto;" /></div>`
            }
            html += '</div>'
            return html
          }).join('')
        }
      } catch {
        // If not JSON, treat as plain text
        // Try to find and replace any img tags in the content
        let formatted = this.formatText(content)
        // Replace any img tags with styled versions
        formatted = formatted.replace(/<img([^>]*)>/gi, (match, attrs) => {
          // Preserve existing attributes but add our styles
          const styleAttr = 'style="max-width: 100%; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); object-fit: contain; display: block; margin: 20px auto;"'
          if (attrs.includes('style=')) {
            // If style already exists, merge it
            return match.replace(/style="[^"]*"/, styleAttr)
          } else {
            return `<img${attrs} ${styleAttr}>`
          }
        })
        return formatted
      }
      return this.formatText(content)
    }
  }
}
</script>

<style scoped>
.blog-detail-page {
  padding-top: 100px;
  padding-bottom: 60px;
  min-height: 100vh;
  background: #f9fafb;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #dc2626;
}

.blog-post {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.post-header {
  margin-bottom: 30px;
}

.chip {
  display: inline-block;
  padding: 6px 12px;
  background: #eef2ff;
  color: #3730a3;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}

.post-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.post-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.post-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: #f3f4f6;
  color: #4f46e5;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
}

.post-cover {
  margin: 30px 0;
  border-radius: 12px;
  overflow: hidden;
}

.post-cover img {
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
  display: block;
}

.post-description {
  font-size: 18px;
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 30px;
  font-style: italic;
}

.post-content {
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
}

.content-block {
  margin-bottom: 30px;
}

.block-text {
  margin-bottom: 20px;
}

.block-image {
  margin: 30px 0;
  text-align: center;
}

.block-image img {
  max-width: 100%;
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

/* Ensure all images in content are properly sized - using deep selector for v-html content */
.post-content :deep(img) {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
  display: block !important;
  margin: 20px auto !important;
}

/* Also target images directly in content-block */
.content-block :deep(img) {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
  display: block !important;
  margin: 20px auto !important;
}

/* Target all images in block-text as well */
.block-text :deep(img) {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
  display: block !important;
  margin: 20px auto !important;
}

.content-text {
  white-space: pre-wrap;
}

.content-text :deep(img) {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: contain;
  display: block !important;
  margin: 20px auto !important;
}

.back-link {
  margin-top: 40px;
  text-align: center;
}

.btn-back {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #4338ca;
  transform: translateX(-4px);
}

@media (max-width: 768px) {
  .blog-post {
    padding: 24px;
  }
  
  .post-title {
    font-size: 24px;
  }
  
  .post-meta {
    font-size: 12px;
  }
}
</style>

