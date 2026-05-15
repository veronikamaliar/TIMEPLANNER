<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useTasksStore } from '@/stores/tasksStore'
import { useRouter } from 'vue-router'
import ErrorMessage from '@/components/common/ErrorMessage.vue'

const tasksStore = useTasksStore()
const router = useRouter()

onMounted(() => {
  tasksStore.fetchTasks()
})

const editTask = (id: number) => router.push(`/dashboard/tasks/update/${id}`)

const matrix = computed(() => {
  const tasks = tasksStore.filteredTasks.filter(t => !t.completed)
  const now = new Date()
  const twoDaysFromNow = new Date()
  twoDaysFromNow.setDate(now.getDate() + 2) 

  return {
    do: tasks.filter(t => 
      t.priority === 'HIGH' && 
      t.dueDate && new Date(t.dueDate) <= twoDaysFromNow
    ),

    schedule: tasks.filter(t => 
      (t.priority === 'HIGH' || t.priority === 'MEDIUM') && 
      (!t.dueDate || new Date(t.dueDate) > twoDaysFromNow)
    ),

    delegate: tasks.filter(t => 
      t.priority === 'LOW' && 
      t.dueDate && new Date(t.dueDate) <= twoDaysFromNow
    ),

    eliminate: tasks.filter(t => 
      t.priority === 'LOW' && 
      (!t.dueDate || new Date(t.dueDate) > twoDaysFromNow)
    )
  }
})

const getCardClass = (type: string) => {
  switch (type) {
    case 'do': return 'bg-pink-100'
    case 'schedule': return 'bg-yellow-100'
    case 'delegate': return 'bg-green-100'
    case 'eliminate': return 'bg-gray-100'
    default: return ''
  }
}
</script>

<template>
  <div class="p-6 max-w-full">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Матриця Ейзенхауера</h1>
      <p class="text-gray-500 mt-2">Розподіл завдань за пріоритетністю та терміновістю</p>
    </div>

    <ErrorMessage v-if="tasksStore.error" :message="tasksStore.error" />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
      
      <div :class="getCardClass('do')" class="flex flex-col rounded-xl shadow-sm border p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-pink-700 uppercase tracking-wider flex items-center gap-2">
            
            Зробити
          </h2>
          <span class="text-xs font-semibold text-red-600 px-2 py-1 rounded">Терміново і Важливо</span>
        </div>
        <div class="flex-1 space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
          <div v-for="task in matrix.do" :key="task.id" @click="editTask(task.id)"
            class="p-3 bg-white border rounded-lg  cursor-pointer transition-all border-rose-100">
            <h3 class="font-medium text-gray-800">{{ task.title }}</h3>
            <p v-if="task.dueDate" class="text-[10px] text-rose-500 mt-1">До: {{ new Date(task.dueDate).toLocaleDateString() }}</p>
          </div>
          <div v-if="!matrix.do.length" class="text-gray-400 text-center py-10 text-sm italic">Немає термінових завдань</div>
        </div>
      </div>

      <div :class="getCardClass('schedule')" class="flex flex-col rounded-xl shadow-sm border p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-2">
            Запланувати
          </h2>
          <span class="text-xs font-semibold text-yellow-600 px-2 py-1 rounded">Нетерміново і Важливо</span>
        </div>
        <div class="flex-1 space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
          <div v-for="task in matrix.schedule" :key="task.id" @click="editTask(task.id)"
            class="p-3 bg-white border rounded-lg  cursor-pointer transition-all border-yellow-100">
            <h3 class="font-medium text-gray-800">{{ task.title }}</h3>
          </div>
          <div v-if="!matrix.schedule.length" class="text-gray-400 text-center py-10 text-sm italic">Немає завдань</div>
        </div>
      </div>

      <div :class="getCardClass('delegate')" class="flex flex-col rounded-xl shadow-sm border p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-green-700 uppercase tracking-wider flex items-center gap-2">
            Делегувати
          </h2>
          <span class="text-xs font-semibold text-green-600 px-2 py-1 rounded">Терміново і Неважливо</span>
        </div>
        <div class="flex-1 space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
          <div v-for="task in matrix.delegate" :key="task.id" @click="editTask(task.id)"
            class="p-3 bg-white border rounded-lg  cursor-pointer transition-all border-green-100">
            <h3 class="font-medium text-gray-800">{{ task.title }}</h3>
          </div>
          <div v-if="!matrix.delegate.length" class="text-gray-400 text-center py-10 text-sm italic">Немає завдань</div>
        </div>
      </div>

      <div :class="getCardClass('eliminate')" class="flex flex-col rounded-xl shadow-sm border p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            Видалити
          </h2>
          <span class="text-xs font-semibold text-gray-600 px-2 py-1 rounded">Нетерміново і Неважливо</span>
        </div>
        <div class="flex-1 space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
          <div v-for="task in matrix.eliminate" :key="task.id" @click="editTask(task.id)"
            class="p-3 bg-white border rounded-lg  cursor-pointer transition-all border-gray-200">
            <h3 class="font-medium text-gray-800">{{ task.title }}</h3>
          </div>
          <div v-if="!matrix.eliminate.length" class="text-gray-400 text-center py-10 text-sm italic">Чисто</div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
</style>