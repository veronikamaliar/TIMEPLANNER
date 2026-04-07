<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useTasksStore } from '@/stores/tasksStore'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import { useRouter } from 'vue-router'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import socketService from '@/services/socket.service'
import { isAdmin, getUserFromToken } from '@/utils/auth'

const tasksStore = useTasksStore()
const router = useRouter()

const currentUserId = getUserFromToken()?.id

onMounted(() => {
  tasksStore.fetchTasks()
  socketService.on('task:created', onCreated)
  socketService.on('task:updated', onUpdated)
  socketService.on('task:deleted', onDeleted)
})

onUnmounted(() => {
  socketService.off('task:created', onCreated)
  socketService.off('task:updated', onUpdated)
  socketService.off('task:deleted', onDeleted)
})

const displayedTasks = computed(() => tasksStore.filteredTasks)

const addTask = () => router.push('/dashboard/tasks/create')
const editTask = (id: number) => router.push(`/dashboard/tasks/update/${id}`)
const onSearchChange = (value: string) => tasksStore.setSearchQuery(value)

const toggleTaskStatus = async (task: any) => {
  try {
    const updatedTask = { ...task, completed: !task.completed }
    await tasksStore.updateTask(task.id, updatedTask)
  } catch (err) {
    console.error('Помилка при зміні статусу завдання:', err)
  }
}

const onCreated = (task: any) => tasksStore.fetchTasks()
const onUpdated = (task: any) => tasksStore.updateTask(task.id, task)
const onDeleted = (id: number) => tasksStore.deleteTask(id)

const canEdit = (task: any) => isAdmin() || task.userId === currentUserId


const formatTime = (seconds: number) => {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}г ${m}хв`
  if (m > 0) return `${m}хв ${s}с`
  return `${s}с`
}

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
</script>

<template>
  <ErrorMessage v-if="tasksStore.error" :message="tasksStore.error" />

  <div class="max-w-full">
    <div class="flex justify-between items-center mb-6 gap-4">
      <h1 class="text-3xl font-bold">Завдання</h1>
      <Button variant="primary" @click="addTask" class="whitespace-nowrap">Додати завдання</Button>
    </div>

    <Input
      v-model="tasksStore.searchQuery"
      placeholder="Пошук завдань..."
      @input="onSearchChange(tasksStore.searchQuery)"
      class="mb-4 max-w-sm"
    />

    <div v-if="tasksStore.loading">Завантаження...</div>

    <div v-else class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm border-collapse">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-2 text-center border-r border-gray-200 w-10">
                <span class="sr-only">Статус</span>
              </th>
              <th class="px-4 py-2 text-left border-r border-gray-200 whitespace-nowrap">Назва</th>
              <th class="px-4 py-2 text-left border-r border-gray-200 whitespace-nowrap">Опис</th>
              <th class="px-4 py-2 text-left border-r border-gray-200 whitespace-nowrap">Користувач</th>
              <th class="px-4 py-2 text-left border-r border-gray-200 whitespace-nowrap">Пріоритет</th>
              <th class="px-4 py-2 text-left border-r border-gray-200 whitespace-nowrap">Дата виконання</th>
              <th class="px-4 py-2 text-left border-r border-gray-200 whitespace-nowrap">Виконано</th>
              <th class="px-4 py-2 text-left border-r border-gray-200 whitespace-nowrap">Час</th>
              <th class="px-4 py-2 text-left border-r border-gray-200 whitespace-nowrap">Вкладення</th>
              <th class="px-4 py-2 text-left border-r border-gray-200 whitespace-nowrap">Категорія</th>
              <th class="px-4 py-2 text-right whitespace-nowrap">Дії</th>
            </tr>
          </thead>

          <tbody>
            <tr 
              v-for="task in displayedTasks" 
              :key="task.id" 
              class="border-t hover:bg-gray-50 transition-colors"
              :class="{ 'bg-gray-50/50': task.completed }"
            >
              <td class="px-4 py-2 border-r border-gray-200 text-center">
                <input 
                  type="checkbox" 
                  :checked="task.completed"
                  @change="toggleTaskStatus(task)"
                  class="w-4 h-4 cursor-pointer accent-pink-500 rounded"
                />
              </td>

              <td class="px-4 py-2 border-r border-gray-200 font-medium whitespace-nowrap" :class="{ 'line-through text-gray-400': task.completed }">
                {{ task.title }}
              </td>

              <td class="px-4 py-2 border-r border-gray-200 max-w-xs whitespace-nowrap overflow-hidden text-ellipsis" :class="{ 'text-gray-400': task.completed }">
                {{ task.description || '—' }}
              </td>

              <td class="px-4 py-2 border-r border-gray-200 whitespace-nowrap">{{ task.user?.name || '—' }}</td>

              <td class="px-4 py-2 border-r border-gray-200 whitespace-nowrap">
                <span
                  v-if="task.priority"
                  :class="{
                    'bg-rose-50 text-rose-600':   task.priority === 'HIGH',
                    'bg-amber-50 text-amber-600': task.priority === 'MEDIUM',
                    'bg-emerald-50 text-emerald-600': task.priority === 'LOW',
                    'opacity-50': task.completed
                  }"
                  class="px-2 py-0.5 rounded-full text-xs font-medium border"
                >
                  {{ task.priority }}
                </span>
                <span v-else>—</span>
              </td>

              <td class="px-4 py-2 border-r border-gray-200 whitespace-nowrap">
                {{ task.dueDate ? new Date(task.dueDate).toLocaleDateString('uk-UA') : '—' }}
              </td>

              <td class="px-4 py-2 border-r border-gray-200 whitespace-nowrap">
                <span
                  :class="task.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ task.completed ? 'Виконано' : 'В процесі' }}
                </span>
              </td>

              <td class="px-4 py-2 border-r border-gray-200 whitespace-nowrap">
  {{ formatTime(task.timeSpent) }}
</td>

              <td class="px-4 py-2 border-r border-gray-200 whitespace-nowrap">
  <template v-if="task.files?.length">
    <div class="flex flex-col gap-1">
      <a
  v-for="file in task.files"
  :key="file.id"
  :href="`${apiBaseUrl}/${file.path}`"
  target="_blank"
  class="flex items-center gap-1 text-pink-500 hover:underline text-xs"
>
        <span class="truncate max-w-[120px]">
          {{ file.originalName }}
        </span>
      </a>
    </div>
  </template>
  <template v-else>—</template>
</td>

              <td class="px-4 py-2 border-r border-gray-200 whitespace-nowrap">{{ task.category?.name || '—' }}</td>

              <td class="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                <Button
                  v-if="canEdit(task)"
                  class="my-1"
                  size="sm"
                  variant="secondary"
                  @click="editTask(task.id)"
                >
                  Редагувати
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  @click="tasksStore.deleteTask(task.id)"
                >
                  Видалити
                </Button>
              </td>
            </tr>

            <tr v-if="displayedTasks.length === 0">
              <td colspan="11" class="px-4 py-6 text-center text-gray-500">
                Завдань не знайдено
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>


<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 6px; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

.sticky {
  z-index: 10;
}
</style>