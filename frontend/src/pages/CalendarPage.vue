<script setup lang="ts">
import { ref, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '@/services/api';

interface Task {
  id: number;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  completed: boolean;
  timeSpent?: string;
  attachment?: string;
  category?: { id: number; name: string } | null;
}

const selectedTask = ref<Task | null>(null);
const isModalOpen = ref(false);

const priorityConfig: Record<string, { label: string; class: string }> = {
  LOW:    { label: 'Низький',   class: 'bg-green-100 text-green-700' },
  MEDIUM: { label: 'Середній', class: 'bg-yellow-100 text-yellow-700' },
  HIGH:   { label: 'Високий',  class: 'bg-red-100 text-red-700' },
};

const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  height: 'auto',
  locale: 'uk',
  buttonText: {
    today: 'Сьогодні',
    month: 'Місяць',
    week: 'Тиждень',
  },
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek', 
  },
  events: [] as any[],
  eventClick: handleEventClick,
});


async function loadTasks() {
  try {
    const res = await api.get('/tasks'); 
    const tasks: Task[] = res.data.data;

    const mapped = tasks
      .filter(t => t.dueDate)
      .map(t => ({
        id: t.id,
        title: t.title,
        date: t.dueDate!.split('T')[0],
        extendedProps: t,
        color: t.completed ? '#6b7280' : getPriorityColor(t.priority),
      }));

    calendarOptions.value = { ...calendarOptions.value, events: mapped };
  } catch (err) {
    console.error('Error loading tasks:', err);
  }
}

function getPriorityColor(priority?: string) {
  const colors: Record<string, string> = {
    HIGH:   '#ef4444',
    MEDIUM: '#f59e0b',
    LOW:    '#3b82f6',
  };
  return colors[priority ?? ''] ?? '#3b82f6';
}

function handleEventClick(info: any) {
  selectedTask.value = { id: info.event.id, title: info.event.title, ...info.event.extendedProps };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  selectedTask.value = null;
}

function formatDate(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

onMounted(loadTasks);
</script>

<template>
  <div class="max-w-6xl mx-auto p-4">
    <FullCalendar :options="calendarOptions" />
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
       
        <div class="absolute inset-0 bg-black/50" @click="closeModal" />

        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 z-10 overflow-hidden">

          

          <div class="p-6">
            <div class="flex items-start justify-between mb-5">
              <h2 class="text-xl font-semibold text-gray-800 pr-4 leading-snug">
                {{ selectedTask?.title }}
              </h2>
              <button
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none flex-shrink-0"
              >
                &times;
              </button>
            </div>

            <dl class="space-y-3 text-sm">

              <div class="flex items-center gap-3">
                <dt class="w-36 text-gray-400 flex-shrink-0">Статус</dt>
                <dd>
                  <span
                    :class="selectedTask?.completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'"
                    class="px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {{ selectedTask?.completed ? '✓ Виконано' : '● В процесі' }}
                  </span>
                </dd>
              </div>

              <div class="flex items-center gap-3">
                <dt class="w-36 text-gray-400 flex-shrink-0">Пріоритет</dt>
                <dd>
                  <span
                    v-if="selectedTask?.priority"
                    :class="priorityConfig[selectedTask.priority]?.class ?? 'bg-gray-100 text-gray-600'"
                    class="px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {{ priorityConfig[selectedTask.priority]?.label ?? selectedTask.priority }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </dd>
              </div>

              <div class="flex items-center gap-3">
                <dt class="w-36 text-gray-400 flex-shrink-0">Категорія</dt>
                <dd class="text-gray-700">
                  {{ selectedTask?.category?.name ?? '—' }}
                </dd>
              </div>

              <div class="flex items-center gap-3">
                <dt class="w-36 text-gray-400 flex-shrink-0">Дата виконання</dt>
                <dd class="text-gray-700">{{ formatDate(selectedTask?.dueDate) }}</dd>
              </div>

              <div class="flex items-center gap-3">
                <dt class="w-36 text-gray-400 flex-shrink-0">Витрачений час</dt>
                <dd class="text-gray-700">{{ selectedTask?.timeSpent ?? '—' }}</dd>
              </div>

              <div class="flex gap-3">
                <dt class="w-36 text-gray-400 flex-shrink-0">Опис</dt>
                <dd class="text-gray-700 leading-relaxed">
                  {{ selectedTask?.description || '—' }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>