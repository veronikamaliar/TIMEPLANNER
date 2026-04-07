<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { isAdmin } from '@/utils/auth'

const router = useRouter()
const route = useRoute()

const adminItems = [
  { name: 'Головна',      path: '/dashboard/board' },
  { name: 'Користувачі', path: '/dashboard/users' },
  { name: 'Завдання',    path: '/dashboard/tasks' },
  { name: 'Категорії',   path: '/dashboard/categories' },
  { name: 'Календар',    path: '/calendar' },
  { name: 'Акаунт',      path: '/account' },
]

const userItems = [
  { name: 'Головна',    path: '/dashboard/board' },
  { name: 'Завдання',   path: '/dashboard/tasks' },
  { name: 'Категорії',  path: '/dashboard/categories' },
  { name: 'Календар',   path: '/calendar' },
  { name: 'Акаунт',     path: '/account' },
]

const menuItems = computed(() => isAdmin() ? adminItems : userItems)
</script>

<template>
  <div class="min-h-screen flex bg-gray-100">
    <aside class="w-64 bg-white shadow-md p-4 flex-shrink-0">
      <nav class="flex flex-col gap-2">
        <button
          v-for="item in menuItems"
          :key="item.path"
          @click="router.push(item.path)"
          :class="[
            'text-left px-4 py-2 rounded transition font-medium',
            route.path === item.path
              ? 'bg-pink-200 text-pink-700'
              : 'text-gray-600 hover:bg-pink-100 hover:text-pink-600'
          ]"
        >
          {{ item.name }}
        </button>
      </nav>
    </aside>

    <main class="flex-1 p-6 overflow-auto">
      <slot />
    </main>
  </div>
</template>