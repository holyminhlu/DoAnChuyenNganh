<template>
  <main class="blog-page">
    <section class="container blog-layout">
      <aside class="sidebar">
        <div class="card">
          <h2 class="card-title">Danh mục</h2>
          <ul class="category-list">
            <li><a href="#" @click.prevent="selectCategory('Tài liệu học tập')" :class="{ active: selectedCategory === 'Tài liệu học tập' }">Tài liệu học tập</a></li>
            <li><a href="#" @click.prevent="selectCategory('Mẹo học tập')" :class="{ active: selectedCategory === 'Mẹo học tập' }">Mẹo học tập</a></li>
            <li><a href="#" @click.prevent="selectCategory('Công nghệ / Lập trình')" :class="{ active: selectedCategory === 'Công nghệ / Lập trình' }">Công nghệ / Lập trình</a></li>
            <li><a href="#" @click.prevent="selectCategory('Kinh nghiệm sinh viên')" :class="{ active: selectedCategory === 'Kinh nghiệm sinh viên' }">Kinh nghiệm sinh viên</a></li>
            <li><a href="#" @click.prevent="selectCategory('Hướng dẫn sử dụng OLF')" :class="{ active: selectedCategory === 'Hướng dẫn sử dụng OLF' }">Hướng dẫn sử dụng OLF</a></li>
            <li><a href="#" @click.prevent="selectCategory(null)" :class="{ active: selectedCategory === null }">Tất cả</a></li>
          </ul>
        </div>

        <div class="card">
          <h2 class="card-title">Thẻ nổi bật</h2>
          <div class="tags">
            <a v-for="tag in tags.slice(0, 6)" :key="tag.tag" class="tag" href="#">{{ tag.tag }}</a>
            <span v-if="tags.length === 0" class="empty-state">Chưa có thẻ nào</span>
          </div>
        </div>

        <div class="card">
          <h2 class="card-title">Bài viết mới</h2>
          <ul class="recent-list">
            <li v-for="post in recentPosts" :key="post.blog_post_id || post._id">
              <a href="#" @click.prevent="goToPost(post)">{{ post.title }}</a>
              <span class="meta">{{ formatTime(post.publishedDate) }}</span>
            </li>
            <li v-if="recentPosts.length === 0" class="empty-state">Chưa có bài viết nào</li>
          </ul>
        </div>
      </aside>

      <section class="content">
        <div v-if="loading" class="loading-state">
          <p>Đang tải dữ liệu...</p>
        </div>
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button class="btn" @click="loadBlogData">Thử lại</button>
        </div>
        <template v-else>
          <div class="featured-grid">
            <article v-for="post in filteredFeatured" :key="post.blog_post_id || post._id" class="featured-card">
              <div class="thumb" :style="{ backgroundImage: `url(${getPostImage(post)})` }"></div>
              <div class="featured-body">
                <div class="chip">{{ post.category }}</div>
                <h3 class="title"><a href="#" @click.prevent="goToPost(post)">{{ post.title }}</a></h3>
                <p class="excerpt">{{ post.description }}</p>
                <div class="post-meta">
                  <span>✍️ {{ getAuthorName(post) }}</span>
                  <span>· {{ formatTime(post.publishedDate) }}</span>
                  <div class="tags">
                    <span v-for="tag in (post.tags || [])" :key="tag" class="tag small">{{ tag }}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>

        <div class="toolbar">
          <div class="tabs">
            <button :class="['tab', activeTab === 'latest' ? 'active' : '']" @click="activeTab = 'latest'">Mới nhất</button>
            <button :class="['tab', activeTab === 'popular' ? 'active' : '']" @click="activeTab = 'popular'">Phổ biến</button>
            <button :class="['tab', activeTab === 'editor' ? 'active' : '']" @click="activeTab = 'editor'">Biên tập chọn</button>
          </div>
        </div>

          <ul class="post-list">
            <li v-for="post in filteredPosts" :key="post.blog_post_id || post._id" class="post-item">
              <div class="post-left">
                <div class="thumb sm" :style="{ backgroundImage: `url(${getPostImage(post)})` }"></div>
              </div>
              <div class="post-right">
                <div class="chip">{{ post.category }}</div>
                <h3 class="title"><a href="#" @click.prevent="goToPost(post)">{{ post.title }}</a></h3>
                <p class="excerpt">{{ post.description }}</p>
                <div class="post-meta">
                  <span>✍️ {{ getAuthorName(post) }}</span>
                  <span>· {{ formatTime(post.publishedDate) }}</span>
                  <span>· 👁️ {{ post.views || 0 }} lượt xem</span>
                </div>
              </div>
            </li>
            <li v-if="filteredPosts.length === 0" class="empty-state">
              <p>Chưa có bài viết nào</p>
            </li>
          </ul>
        </template>

          <div class="pagination" v-if="pagination.pages > 1">
            <button class="btn" :disabled="pagination.page === 1" @click="pagination.page--; loadBlogData()">«</button>
            <button 
              v-for="page in pagination.pages" 
              :key="page" 
              :class="['btn', pagination.page === page ? 'primary' : '']"
              @click="pagination.page = page; loadBlogData()"
            >
              {{ page }}
            </button>
            <button class="btn" :disabled="pagination.page === pagination.pages" @click="pagination.page++; loadBlogData()">»</button>
          </div>
      </section>
    </section>
  </main>
</template>

<script>
import { getAllPosts, getFeaturedPosts, getPopularPosts, getAllTags } from '@/utils/blogAPI'

export default {
  name: 'Blog LOF',
  data() {
    return {
      search: '',
      activeTab: 'latest',
      selectedCategory: null,
      featured: [],
      posts: [],
      recentPosts: [],
      tags: [],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    }
  },
  async mounted() {
    await this.loadBlogData()
  },
  computed: {
    filteredFeatured() {
      let filtered = this.featured
      
      // Filter by category
      if (this.selectedCategory) {
        filtered = filtered.filter(p => p.category === this.selectedCategory)
      }
      
      // Filter by search
      const q = this.search.trim().toLowerCase()
      if (q) {
        filtered = filtered.filter(p =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          (p.author?.name && p.author.name.toLowerCase().includes(q))
        )
      }
      
      return filtered
    },
    filteredPosts() {
      let filtered = this.posts
      
      // Filter by category
      if (this.selectedCategory) {
        filtered = filtered.filter(p => p.category === this.selectedCategory)
      }
      
      // Filter by search
      const q = this.search.trim().toLowerCase()
      if (q) {
        filtered = filtered.filter(p =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          (p.author?.name && p.author.name.toLowerCase().includes(q))
        )
      }
      
      return filtered
    }
  },
  watch: {
    activeTab() {
      this.loadBlogData()
    }
  },
  methods: {
    async loadBlogData() {
      this.loading = true
      this.error = null
      
      try {
        // Load featured posts
        const featuredResponse = await getFeaturedPosts(3)
        if (featuredResponse.success) {
          this.featured = featuredResponse.data || []
        }

        // Load posts based on active tab
        let postsResponse
        const queryParams = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          status: 'published'
        }
        
        // Add category filter if selected
        if (this.selectedCategory) {
          queryParams.category = this.selectedCategory
        }
        
        if (this.activeTab === 'popular') {
          postsResponse = await getPopularPosts(10)
          // Apply category filter manually for popular posts
          if (this.selectedCategory && postsResponse.success) {
            postsResponse.data = postsResponse.data.filter(p => p.category === this.selectedCategory)
          }
        } else if (this.activeTab === 'editor') {
          queryParams.featured = true
          postsResponse = await getAllPosts(queryParams)
        } else {
          // latest
          queryParams.sortBy = 'publishedDate'
          queryParams.sortOrder = 'desc'
          postsResponse = await getAllPosts(queryParams)
        }

        if (postsResponse.success) {
          this.posts = postsResponse.data || []
          if (postsResponse.pagination) {
            this.pagination = {
              ...this.pagination,
              ...postsResponse.pagination
            }
          }
          // Get recent posts (first 4)
          this.recentPosts = this.posts.slice(0, 4)
        }

        // Load tags
        const tagsResponse = await getAllTags()
        if (tagsResponse.success) {
          this.tags = tagsResponse.data || []
        }
      } catch (error) {
        console.error('Error loading blog data:', error)
        this.error = 'Không thể tải dữ liệu blog. Vui lòng thử lại sau.'
        // Set empty arrays on error
        this.featured = []
        this.posts = []
        this.recentPosts = []
        this.tags = []
      } finally {
        this.loading = false
      }
    },
    formatTime(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 60) return `${minutes} phút trước`
      if (hours < 24) return `${hours} giờ trước`
      if (days < 7) return `${days} ngày trước`
      return date.toLocaleDateString('vi-VN')
    },
    getPostImage(post) {
      return post.coverImage || '/img/images/tranding-food-1.png'
    },
    getAuthorName(post) {
      if (typeof post.author === 'object' && post.author.name) {
        return post.author.name
      }
      return post.author || 'Admin'
    },
    goToPost(post) {
      // Navigate to blog detail page using slug or ID
      const identifier = post.slug || post.blog_post_id || post._id
      this.$router.push(`/blog/${identifier}`)
    },
    selectCategory(category) {
      this.selectedCategory = category
      // Reset pagination when category changes
      this.pagination.page = 1
      // Reload data when category changes
      this.loadBlogData()
    }
  }
}
</script>

<style scoped>
.blog-page { padding-top: 100px; }

.container { max-width: 1200px; margin: 0 auto; padding: 20px; }

.blog-layout { display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
.sidebar .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
.card + .card { margin-top: 16px; }
.card-title { margin: 0 0 10px 0; font-size: 16px; color: #111827; }
.category-list { list-style: none; padding: 0; margin: 0; }
.category-list li a { display: block; padding: 8px 10px; border-radius: 8px; color: #374151; text-decoration: none; cursor: pointer; }
.category-list li a:hover { background: #f3f4f6; }
.category-list li a.active { background: #eef2ff; color: #3730a3; font-weight: 500; }
.tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag { background: #f3f4f6; color: #374151; padding: 6px 10px; border-radius: 999px; text-decoration: none; font-size: 12px; }
.tag.small { font-size: 11px; padding: 4px 8px; }

.featured-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
.featured-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
.thumb { background-size: cover; background-position: center; height: 160px; }
.thumb.sm { height: 90px; width: 140px; border-radius: 12px; }
.featured-body { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.chip { display: inline-block; padding: 4px 8px; background: #eef2ff; color: #3730a3; border-radius: 999px; font-size: 12px; }
.title { margin: 0; }
.title a { color: #111827; text-decoration: none; }
.title a:hover { color: #4f46e5; }
.excerpt { margin: 0; color: #4b5563; }
.post-meta { display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin: 12px 0; }
.tabs { display: flex; gap: 8px; }
.tab { border: 1px solid #e5e7eb; background: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.tab.active { background: #eef2ff; border-color: #4f46e5; color: #3730a3; }

.post-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.post-item { display: grid; grid-template-columns: 160px 1fr; gap: 16px; background: #fff; border: 1px solid #f3f4f6; border-radius: 12px; padding: 12px; }
.post-left { display: flex; align-items: center; justify-content: center; }
.post-right .chip { margin-bottom: 6px; }

.btn { padding: 10px 16px; border-radius: 8px; border: 1px solid #e5e7eb; background: #ffffff; color: #374151; cursor: pointer; }
.btn.primary { background: #4f46e5; color: #ffffff; border-color: #4f46e5; }
.pagination { margin-top: 16px; display: flex; gap: 8px; justify-content: center; }
.pagination .btn:disabled { opacity: 0.5; cursor: not-allowed; }

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}
.error-state { color: #dc2626; }
.error-state .btn { margin-top: 12px; }

.recent-list { list-style: none; padding: 0; margin: 0; }
.recent-list li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.recent-list li:last-child { border-bottom: none; }
.recent-list a { color: #374151; text-decoration: none; display: block; margin-bottom: 4px; }
.recent-list a:hover { color: #4f46e5; }
.recent-list .meta { font-size: 12px; color: #9ca3af; }

@media (max-width: 991px) {
  .hero-inner { grid-template-columns: 1fr; }
  .blog-layout { grid-template-columns: 1fr; }
  .featured-grid { grid-template-columns: 1fr; }
  .post-item { grid-template-columns: 1fr; }
  .thumb.sm { width: 100%; height: 160px; }
}
</style>


