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

// Оновлені пастельні кольори для бейджів у модальному вікні
const priorityConfig: Record<string, { label: string; class: string }> = {
  LOW:    { label: 'Низький',   class: 'bg-[#d1fae5] text-[#065f46]' }, // Пастельний зелений
  MEDIUM: { label: 'Середній', class: 'bg-[#fef3c7] text-[#92400e]' }, // Пастельний жовтий
  HIGH:   { label: 'Високий',   class: 'bg-[#ede9fe] text-[#5b21b6]' }, // Пастельний фіолетовий
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
      .map(t => {
        const baseColor = getPriorityColor(t.priority);
        return {
          id: t.id,
          title: t.title,
          date: t.dueDate!.split('T')[0],
          extendedProps: t,
          // Використовуємо напівпрозорий фон для пастельного ефекту
          backgroundColor: t.completed ? '#f3f4f6' : `${baseColor}33`, // Додаємо прозорість 20% (33 в hex)
          borderColor: t.completed ? '#e5e7eb' : baseColor,
          // Робимо текст темнішим для кращої читаємості на пастельному фоні
          textColor: t.completed ? '#9ca3af' : adjustColorTone(baseColor, -50), 
        };
      });

    calendarOptions.value = { ...calendarOptions.value, events: mapped };
  } catch (err) {
    console.error('Error loading tasks:', err);
  }
}

// Функція для отримання базового пастельного кольору за пріоритетом
function getPriorityColor(priority?: string) {
  const colors: Record<string, string> = {
    HIGH:   '#a78bfa', // Пастельний фіолетовий
    MEDIUM: '#fbbf24', // Пастельний жовтий
    LOW:    '#34d399', // Пастельний зелений
  };
  // За замовчуванням - пастельний синій
  return colors[priority ?? ''] ?? '#60a5fa'; 
}

// Допоміжна функція для затемнення кольору (щоб текст був читабельним)
function adjustColorTone(hex: string, lum: number) {
  hex = String(hex).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  lum = lum || 0;
  let rgb = "#", c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i * 2, 2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    rgb += ("00" + c).substr(c.length);
  }
  return rgb;
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
  <div class="p-8">
   

    <div class="bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm">
      <FullCalendar :options="calendarOptions" />
    </div>
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="closeModal" />

        <div class="relative bg-white rounded-[24px] shadow-2xl w-full max-w-lg mx-4 z-10 overflow-hidden border border-gray-100">
          <div class="p-8">
            <div class="flex items-start justify-between mb-6">
              <h2 class="text-2xl font-bold text-[#1a1a1a] pr-4 leading-tight">
                {{ selectedTask?.title }}
              </h2>
              <button
                @click="closeModal"
                class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <span class="text-2xl">&times;</span>
              </button>
            </div>

            <div class="space-y-5">
              <div class="grid grid-cols-3 gap-4 items-center">
                <span class="text-[#9ca3af] font-medium">Статус</span>
                <div class="col-span-2">
                  <span
                    :class="selectedTask?.completed ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-[#2563eb]'"
                    class="px-4 py-1 rounded-full text-sm font-semibold"
                  >
                    {{ selectedTask?.completed ? '✓ Виконано' : '● В процесі' }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4 items-center">
                <span class="text-[#9ca3af] font-medium">Пріоритет</span>
                <div class="col-span-2">
                  <span
                    v-if="selectedTask?.priority"
                    :class="priorityConfig[selectedTask.priority]?.class ?? 'bg-gray-100 text-gray-600'"
                    class="px-4 py-1 rounded-full text-sm font-semibold"
                  >
                    {{ priorityConfig[selectedTask.priority]?.label ?? selectedTask.priority }}
                  </span>
                  <span v-else class="text-gray-400 font-medium">—</span>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <span class="text-[#9ca3af] font-medium">Категорія</span>
                <span class="col-span-2 text-[#1a1a1a] font-medium">{{ selectedTask?.category?.name ?? '—' }}</span>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <span class="text-[#9ca3af] font-medium">Дедлайн</span>
                <span class="col-span-2 text-[#1a1a1a] font-medium">{{ formatDate(selectedTask?.dueDate) }}</span>
              </div>

              <div class="pt-4 border-t border-gray-50">
                <span class="block text-[#9ca3af] font-medium mb-2">Опис</span>
                <p class="text-[#4b5563] leading-relaxed bg-gray-50 p-4 rounded-xl">
                  {{ selectedTask?.description || 'Опис відсутній' }}
                </p>
              </div>
            </div>

            <div class="mt-8 flex justify-end">
              <button 
                @click="closeModal"
                class="px-6 py-2 bg-[#ed4b9e] text-white rounded-full font-semibold hover:bg-[#d63d8b] transition-colors shadow-sm shadow-pink-200"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
:deep(.fc) {
  --fc-button-bg-color: #ffffff;
  --fc-button-border-color: #e5e7eb;
  --fc-button-text-color: #4b5563;
  --fc-button-hover-bg-color: #f9fafb;
  --fc-button-active-bg-color: #ed4b9e;
  --fc-button-active-border-color: #ed4b9e;
  --fc-border-color: #f3f4f6;
  font-family: inherit;
}

:deep(.fc .fc-toolbar-title) {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
}

:deep(.fc .fc-button-primary:not(:disabled).fc-button-active),
:deep(.fc .fc-button-primary:not(:disabled):active) {
  color: white !important;
  background-color: #ed4b9e !important;
  border-color: #ed4b9e !important;
  box-shadow: none !important;
}

:deep(.fc-event) {
  cursor: pointer;
  padding: 4px 8px; /* Трохи збільшив відступи */
  border-radius: 8px; /* Більше заокруглення */
  font-size: 0.85rem;
  font-weight: 600; /* Зробив текст жирнішим для кращої читаємості */
  margin-bottom: 3px;
  border-width: 1px; /* Додав тонку рамку */
}

/* Зміна фону сьогоднішнього дня */
:deep(.fc .fc-day-today) {
  background-color: #fdf2f8 !important; /* Дуже світлий рожевий (пастельний) */
  /* Або можна використати пастельний синій: #eff6ff */
}

/* Якщо хочете також змінити колір числа (дати) сьогоднішнього дня */
:deep(.fc .fc-day-today .fc-daygrid-day-number) {
  color: #ed4b9e; /* Ваш акцентний рожевий */
  font-weight: 800;
}

.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative { transform: translateY(20px) scale(0.95); }
.modal-leave-to .relative { transform: translateY(-20px) scale(0.95); }
</style>