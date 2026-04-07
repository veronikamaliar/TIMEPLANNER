<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import StatCard from '@/components/common/StatCard.vue'
import Button from '@/components/common/Button.vue'

import { Bar, Pie, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend)

const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const today = new Date().getDay()
const todayIndex = today === 0 ? 6 : today - 1

const allTasks = ref<any[]>([])
const loading = ref(false)
const error = ref('')

const stats = computed(() => {
  const tasks = allTasks.value
  const todayStr = new Date().toISOString().split('T')[0]
  const now = new Date()
  return {
    tasks:          tasks.length,
    completedTasks: tasks.filter(t => t.completed).length,
    pendingTasks:   tasks.filter(t => !t.completed).length,
    overdueTasks:   tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now).length,
    todayTasks:     tasks.filter(t => t.dueDate?.startsWith(todayStr)).length,
  }
})

const todayTasks = computed(() => {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return allTasks.value.filter(t => {
    if (!t.dueDate) return false
    // ✅ беремо тільки дату без часу і часового поясу
    return t.dueDate.startsWith(todayStr)
  })
})

// ✅ Bar — завдання поточного тижня по днях
const barChartData = computed(() => {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  const now = new Date()
  const currentDay = now.getDay()
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay

  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  allTasks.value.forEach(t => {
    if (!t.dueDate) return
    const taskDate = new Date(t.dueDate)
    if (taskDate < monday || taskDate > sunday) return
    const d = taskDate.getDay()
    counts[d === 0 ? 6 : d - 1]++
  })

  return {
    labels: days,
    datasets: [{
      label: 'Завдання',
      data: counts,
      backgroundColor: counts.map((_, i) => i === todayIndex ? '#f472b6' : '#e5e7eb'),
      borderRadius: 6,
    }]
  }
})

// ✅ Pie — пріоритети
const priorityChartData = computed(() => {
  const tasks = allTasks.value
  return {
    labels: ['Низький', 'Середній', 'Високий'],
    datasets: [{
      data: [
        tasks.filter(t => t.priority === 'LOW').length,
        tasks.filter(t => t.priority === 'MEDIUM').length,
        tasks.filter(t => t.priority === 'HIGH').length,
      ],
      backgroundColor: ['#34d399', '#fbbf24', '#fb7185'],
      borderWidth: 0,
    }]
  }
})

// ✅ Doughnut — виконано vs невиконано
const completionChartData = computed(() => ({
  labels: ['Виконано', 'В процесі'],
  datasets: [{
    data: [stats.value.completedTasks, stats.value.pendingTasks],
    backgroundColor: ['#34d399', '#f9a8d4'],
    borderWidth: 0,
  }]
}))

// ✅ Horizontal Bar — по категоріях
const categoryChartData = computed(() => {
  const categoryMap: Record<string, number> = {}

  allTasks.value.forEach(t => {
    const name = t.category?.name || 'Без категорії'
    categoryMap[name] = (categoryMap[name] || 0) + 1
  })

  const labels = Object.keys(categoryMap)
  const data = Object.values(categoryMap)

  const colors = ['#f472b6', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f87171']

  return {
    labels,
    datasets: [{
      label: 'Завдань',
      data,
      backgroundColor: labels.map((_, i) => colors[i % colors.length]),
      borderRadius: 6,
    }]
  }
})

const barChartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        callback: (value: any) => Number.isInteger(value) ? value : null,
      }
    }
  }
}

const pieChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { padding: 16, font: { size: 13 } }
    }
  }
}

const categoryChartOptions = {
  responsive: true,
  indexAxis: 'y' as const, // ✅ горизонтальний бар
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        callback: (value: any) => Number.isInteger(value) ? value : null,
      }
    }
  }
}

// ✅ Bar — витрачений час по днях тижня (в хвилинах)
const timeSpentChartData = computed(() => {
  const minutes = [0, 0, 0, 0, 0, 0, 0]

  const now = new Date()
  const currentDay = now.getDay()
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay

  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  allTasks.value.forEach(t => {
    if (!t.dueDate || !t.timeSpent) return
    const taskDate = new Date(t.dueDate)
    if (taskDate < monday || taskDate > sunday) return
    const d = taskDate.getDay()
    const index = d === 0 ? 6 : d - 1
    minutes[index] += Math.round(t.timeSpent / 60) // секунди → хвилини
  })

  return {
    labels: days,
    datasets: [{
      label: 'Хвилин',
      data: minutes,
      backgroundColor: minutes.map((_, i) => i === todayIndex ? '#f472b6' : '#e5e7eb'),
      borderRadius: 6,
    }]
  }
})

const timeSpentChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const val = ctx.raw as number
          const h = Math.floor(val / 60)
          const m = val % 60
          return h > 0 ? `${h}г ${m}хв` : `${m}хв`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 10,
        callback: (value: any) => `${value}хв`,
      }
    }
  }
}

// ✅ Gauge — % виконання на сьогодні
const todayProgress = computed(() => {
  const total = todayTasks.value.length
  const done = todayTasks.value.filter(t => t.completed).length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return { total, done, percent }
})

const gaugeChartData = computed(() => ({
  labels: ['Виконано', ''],
  datasets: [{
    data: [todayProgress.value.percent, 100 - todayProgress.value.percent],
    backgroundColor: ['#f472b6', '#f3f4f6'],
    borderWidth: 0,
    circumference: 180, // ✅ півкола
    rotation: -90,
  }]
}))

const gaugeChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
  cutout: '75%',
}

// Таймер
const activeTaskId = ref<number | null>(null)
const timer = ref(0)
let interval: any = null

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const startTimer = (taskId: number) => {
  if (activeTaskId.value && activeTaskId.value !== taskId) return
  activeTaskId.value = taskId
  interval = setInterval(() => { timer.value++ }, 1000)
}

const pauseTimer = () => clearInterval(interval)

const stopTimer = async (task: any) => {
  clearInterval(interval)
  try {
    await api.put(`/tasks/${task.id}`, {
      ...task,
      timeSpent: Math.round((task.timeSpent || 0) + timer.value),
    })
    timer.value = 0
    activeTaskId.value = null
    await fetchTasks()
  } catch (err) {
    console.error(err)
  }
}

const fetchTasks = async () => {
  try {
    loading.value = true
    error.value = ''
    const res = await api.get('/tasks')
    allTasks.value = res.data.data
  } catch (err) {
    error.value = 'Не вдалося завантажити завдання'
  } finally {
    loading.value = false
  }
}

const toggleTaskStatus = async (task: any) => {
  try {
    // Оновлюємо локально для миттєвого фідбеку
    task.completed = !task.completed
    
    await api.put(`/tasks/${task.id}`, {
      ...task,
      completed: task.completed
    })
    // Оновлюємо всі дані, щоб перерахувати статистику та графіки
    await fetchTasks()
  } catch (err) {
    // Якщо помилка — повертаємо стан назад
    task.completed = !task.completed
    console.error('Помилка при оновленні статусу:', err)
  }
}

onMounted(fetchTasks)
</script>

<template>
  <div class="p-6 space-y-6 bg-[#f8f9fa] min-h-screen">
    <div v-if="loading" class="text-gray-500 animate-pulse">Завантаження...</div>
    <div v-if="error" class="text-red-500 font-medium p-4 bg-red-50 rounded-lg">{{ error }}</div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard title="Всі завдання"  :value="stats.tasks" />
      <StatCard title="Виконані"      :value="stats.completedTasks" />
      <StatCard title="Невиконані"    :value="stats.pendingTasks" />
      <StatCard title="Прострочені"   :value="stats.overdueTasks" />
      <StatCard title="На сьогодні"   :value="stats.todayTasks" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div class="md:col-span-2">
        <h2 class="text-xl font-bold mb-4 text-gray-800">Завдання на сьогодні</h2>
        
        <div v-if="todayTasks.length === 0" class="p-8 bg-white rounded-2xl shadow-sm text-gray-400 text-center border-2 border-dashed">
          На сьогодні завдань немає!
        </div>

        <div
          v-for="task in todayTasks"
          :key="task.id"
          class="p-5 rounded-2xl mb-4 bg-white shadow-sm border-l-8 transition-all duration-300"
          :class="task.completed ? 'border-green-400 bg-gray-50' : 'border-pink-400'"
        >
          <div class="flex items-start gap-4">
            <div class="pt-1">
              <input 
                type="checkbox" 
                :checked="task.completed"
                @change="toggleTaskStatus(task)"
                class="w-6 h-6 cursor-pointer accent-pink-500 rounded-md"
              />
            </div>

            <div class="flex-1">
              <div 
                class="font-bold text-lg transition-all"
                :class="task.completed ? 'line-through text-gray-400' : 'text-gray-700'"
              >
                {{ task.title }}
              </div>
              
              <div class="text-sm text-gray-500 mb-4 mt-1">
                Витрачено: <span class="font-mono">{{ formatTime(task.timeSpent || 0) }}</span>
              </div>

              <div v-if="!task.completed">
                <div v-if="activeTaskId === task.id" class="text-pink-500 font-mono mb-3 flex items-center gap-2 bg-pink-50 w-fit px-3 py-1 rounded-full text-sm">
                  <span class="animate-ping text-xs">●</span> {{ formatTime(timer) }}
                </div>
                
                <div class="flex gap-2">
                  <Button @click="startTimer(task.id)" size="sm" variant="primary" class="rounded-xl px-5 py-2 shadow-sm shadow-pink-200">Старт</Button>
                  <Button @click="pauseTimer" size="sm" variant="secondary" class="rounded-xl px-5 py-2">Пауза</Button>
                  <Button @click="stopTimer(task)" size="sm" variant="secondary" class="rounded-xl px-5 py-2 text-pink-500 border-pink-100">Стоп</Button>
                </div>
              </div>

              <div v-else class="flex items-center gap-2 text-green-600 font-semibold text-sm">
                <span>✓ Завдання завершено</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm flex flex-col items-center justify-between border border-gray-50">
        <h2 class="text-base font-bold text-gray-700 self-start">Прогрес на сьогодні</h2>
        
        <div class="relative w-full max-w-[240px] mt-4">
          <Doughnut :data="gaugeChartData" :options="gaugeChartOptions" />
          
          <div class="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <span class="text-3xl font-bold text-pink-500 tracking-tighter">
              {{ todayProgress.percent }}%
            </span>
            <p class="text-[11px] text-gray-400 font-medium uppercase mt-1">
              {{ todayProgress.done }} з {{ todayProgress.total }} завдань
            </p>
          </div>
        </div>

        <p class="text-sm font-medium text-gray-500 mt-6 bg-gray-50 px-4 py-2 rounded-full">
           Залишилось: {{ todayProgress.total - todayProgress.done }} завдань
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
        <h2 class="text-base font-bold text-gray-700 mb-6">Витрачений час по днях тижня</h2>
        <Bar :data="timeSpentChartData" :options="timeSpentChartOptions" />
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
        <h2 class="text-base font-bold text-gray-700 mb-6">Завдання по днях тижня</h2>
        <Bar :data="barChartData" :options="barChartOptions" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col items-center">
        <h2 class="text-base font-bold text-gray-700 mb-6 self-start">Прогрес виконання</h2>
        <div class="w-full max-w-[280px]">
          <Doughnut :data="completionChartData" :options="pieChartOptions" />
        </div>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
        <h2 class="text-base font-bold text-gray-700 mb-6">Завдання по категоріях</h2>
        <Bar :data="categoryChartData" :options="categoryChartOptions" />
      </div>
    </div>
  </div>
</template>