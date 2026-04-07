<script setup>
import Header from '@/components/layout/Header.vue';
import { useSocket } from '@/composables/useSocket';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

useSocket();
const route = useRoute();

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path));
</script>

<template>
  <Header v-if="!isAuthPage" />
  
  <main :class="{ 'auth-layout': isAuthPage }">
    <router-view />
  </main>
</template>

<style>
main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative; 
}

</style>