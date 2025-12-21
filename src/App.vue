<template>
  <div>
    <HeaderComponent v-if="!isAdminRoute"/>
      <router-view/>
    <FooterComponent v-if="!isAdminRoute"/>
  </div>
 
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue'
import FooterComponent from './components/FooterComponent.vue'

export default {
  name: 'App',
  components: {
    HeaderComponent,
    FooterComponent
  },
  computed: {
    isAdminRoute() {
      return this.$route.path.startsWith('/administrator')
    }
  }
}
</script>

<style>

</style>
