<script setup>
import Header from '@/components/layout/Header.vue';
import { useSocket } from '@/composables/useSocket';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

useSocket();
const route = useRoute();

// Використовуємо computed для надійності
const isAuthPage = computed(() => ['/login', '/register'].includes(route.path));
</script>

<template>
  <Header v-if="!isAuthPage" />
  
  <main :class="{ 'auth-layout': isAuthPage }">
    <router-view />
  </main>
</template>

<style>
/* Переконайтеся, що немає стилів, які накладають оверлей на main */
main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative; /* Щоб внутрішні елементи не "вилітали" */
}

</style>