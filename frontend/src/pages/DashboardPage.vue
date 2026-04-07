<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isAdmin } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)

const mainAdminItems = [
  { name: 'Головна',    path: '/dashboard/board',      icon: '/chart-column-big.svg' },
  { name: 'Користувачі', path: '/dashboard/users',      icon: '/users.svg' },
  { name: 'Завдання',    path: '/dashboard/tasks',      icon: '/clipboard-check.svg' },
  { name: 'Категорії',   path: '/dashboard/categories', icon: '/folder.svg' },
  { name: 'Календар',    path: '/dashboard/calendar',   icon: '/calendar-1.svg' },
  { name: 'Матриця Ейзенхауера',    path: '/dashboard/eisenhowermatrix',   icon: '/blocks.svg' },
]

const mainUserItems = [
  { name: 'Головна',    path: '/dashboard/board',      icon: '/chart-column-big.svg' },
  { name: 'Завдання',    path: '/dashboard/tasks',      icon: '/clipboard-check.svg' },
  { name: 'Категорії',   path: '/dashboard/categories', icon: '/folder.svg' },
  { name: 'Календар',    path: '/dashboard/calendar',   icon: '/calendar-1.svg' },
  { name: 'Матриця Ейзенхауера',    path: '/dashboard/eisenhowermatrix',   icon: '/blocks.svg' },
]

const menuItems = computed(() => isAdmin() ? mainAdminItems : mainUserItems)

const navigateTo = (path: string) => {
  router.push(path)
  isMobileMenuOpen.value = false
}

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<template>
  <div class="flex bg-gray-100 h-[calc(100vh-64px)] overflow-hidden relative">
    
    <button 
      @click="isMobileMenuOpen = !isMobileMenuOpen"
      class="md:hidden fixed bottom-6 right-6 z-[60] bg-pink-500 text-white p-4 rounded-full shadow-2xl active:scale-95 transition-transform"
    >
      <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false"
      class="fixed inset-0 bg-black/40 z-40 md:hidden"
    ></div>

    <aside 
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 flex-shrink-0 flex flex-col border-r transition-transform duration-300 md:relative md:translate-x-0 h-full',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <nav class="flex flex-col h-full gap-2">
        <div class="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
          <button
            v-for="item in menuItems"
            :key="item.path"
            @click="navigateTo(item.path)"
            :class="[
              'flex items-center gap-3 text-left px-4 py-3 rounded-xl transition font-medium group',
              route.path === item.path ? 'bg-pink-100 text-pink-600' : 'text-gray-600 hover:bg-pink-50'
            ]"
          >
            <img 
              :src="item.icon" 
              class="w-5 h-5 transition-all"
              :style="route.path === item.path ? 'filter: invert(36%) sepia(85%) saturate(1131%) hue-rotate(305deg);' : 'opacity: 0.5;'"
            />
            <span>{{ item.name }}</span>
          </button>
        </div>

        <div class="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2">
          <button
            @click="navigateTo('/dashboard/account')"
            :class="['flex items-center gap-3 text-left px-4 py-3 rounded-xl transition font-medium', route.path === '/dashboard/account' ? 'bg-pink-100 text-pink-600' : 'text-gray-600']"
          >
            <img src="/user.svg" class="w-5 h-5 opacity-50" :style="route.path === '/dashboard/account' ? 'filter: invert(36%) sepia(85%) saturate(1131%) hue-rotate(305deg);' : ''" />
            <span>Акаунт</span>
          </button>

          <button
            @click="handleLogout"
            class="flex items-center gap-3 text-left px-4 py-3 rounded-xl transition font-medium text-red-500 hover:bg-red-50"
          >
            <img src="/log-out.svg" class="w-5 h-5" style="filter: invert(39%) sepia(61%) saturate(3015%) hue-rotate(338deg);" />
            <span>Вийти</span>
          </button>
        </div>
      </nav>
    </aside>

    <main class="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
      <router-view />
    </main>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #f3f4f6;
  border-radius: 10px;
}
</style>