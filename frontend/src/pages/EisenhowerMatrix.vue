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
    case 'do': return 'border-t-4 border-rose-500 bg-rose-50/30'
    case 'schedule': return 'border-t-4 border-amber-500 bg-amber-50/30'
    case 'delegate': return 'border-t-4 border-emerald-500 bg-emerald-50/30'
    case 'eliminate': return 'border-t-4 border-gray-400 bg-gray-50/30'
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
          <h2 class="font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            Зробити (High)
          </h2>
          <span class="text-xs font-semibold bg-rose-100 text-rose-600 px-2 py-1 rounded">Терміново & Важливо</span>
        </div>
        <div class="flex-1 space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
          <div v-for="task in matrix.do" :key="task.id" @click="editTask(task.id)"
            class="p-3 bg-white border rounded-lg hover:shadow-md cursor-pointer transition-all border-rose-100">
            <h3 class="font-medium text-gray-800">{{ task.title }}</h3>
            <p v-if="task.dueDate" class="text-[10px] text-rose-500 mt-1">До: {{ new Date(task.dueDate).toLocaleDateString() }}</p>
          </div>
          <div v-if="!matrix.do.length" class="text-gray-400 text-center py-10 text-sm italic">Немає термінових завдань</div>
        </div>
      </div>

      <div :class="getCardClass('schedule')" class="flex flex-col rounded-xl shadow-sm border p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            Запланувати (Medium)
          </h2>
          <span class="text-xs font-semibold bg-amber-100 text-amber-600 px-2 py-1 rounded">Нетерміново & Важливо</span>
        </div>
        <div class="flex-1 space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
          <div v-for="task in matrix.schedule" :key="task.id" @click="editTask(task.id)"
            class="p-3 bg-white border rounded-lg hover:shadow-md cursor-pointer transition-all border-amber-100">
            <h3 class="font-medium text-gray-800">{{ task.title }}</h3>
          </div>
          <div v-if="!matrix.schedule.length" class="text-gray-400 text-center py-10 text-sm italic">Поки пусто</div>
        </div>
      </div>

      <div :class="getCardClass('delegate')" class="flex flex-col rounded-xl shadow-sm border p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Делегувати (Low)
          </h2>
          <span class="text-xs font-semibold bg-emerald-100 text-emerald-600 px-2 py-1 rounded">Терміново & Неважливо</span>
        </div>
        <div class="flex-1 space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
          <div v-for="task in matrix.delegate" :key="task.id" @click="editTask(task.id)"
            class="p-3 bg-white border rounded-lg hover:shadow-md cursor-pointer transition-all border-emerald-100">
            <h3 class="font-medium text-gray-800">{{ task.title }}</h3>
          </div>
          <div v-if="!matrix.delegate.length" class="text-gray-400 text-center py-10 text-sm italic">Вільний сектор</div>
        </div>
      </div>

      <div :class="getCardClass('eliminate')" class="flex flex-col rounded-xl shadow-sm border p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-gray-400"></span>
            Видалити / Потім
          </h2>
          <span class="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-1 rounded">Нетерміново & Неважливо</span>
        </div>
        <div class="flex-1 space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar">
          <div v-for="task in matrix.eliminate" :key="task.id" @click="editTask(task.id)"
            class="p-3 bg-white border rounded-lg hover:shadow-md cursor-pointer transition-all border-gray-200">
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