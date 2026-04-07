<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, Field } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { taskSchema, type TaskFormData } from '@/schemas/task.schema'
import { useTasksStore } from '@/stores/tasksStore'
import { useCategoriesStore } from '@/stores/categoriesStore'
import { toast } from 'vue3-toastify'
import Button from '@/components/common/Button.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import api from '@/services/api'

const router = useRouter()
const serverError = ref('')

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()



onMounted(async () => {
  await categoriesStore.fetchCategories()
})

const { handleSubmit, errors } = useForm<TaskFormData>({
  validationSchema: toTypedSchema(taskSchema),
  initialValues: {
    title: '',
    description: '',
    priority: '',
    dueDate: '',
    completed: false,
    timeSpent: '',
    attachment: '',
    categoryId: null,
  },
})

const timeUnit = ref<'seconds' | 'minutes' | 'hours'>('minutes')

function toSeconds(value: string | number, unit: string): number {
  const n = Number(value)
  if (!n) return 0
  if (unit === 'minutes') return n * 60
  if (unit === 'hours')   return n * 3600
  return n // seconds
}

const onSubmit = handleSubmit(async (values) => {
  try {
    serverError.value = ''

    const payload: any = {
      title: values.title,
      completed: Boolean(values.completed),
      priority: values.priority?.toUpperCase() || 'LOW',
    }

    if (values.description?.trim()) payload.description = values.description
    if (values.dueDate) payload.dueDate = values.dueDate
    if (values.timeSpent) payload.timeSpent = toSeconds(values.timeSpent, timeUnit.value)
    if (values.categoryId !== null) payload.categoryId = Number(values.categoryId)

    // Спочатку створюємо task і отримуємо id
    const newTask = await tasksStore.createTask(payload)
    const taskId = newTask?.id

    // Потім завантажуємо файл з taskId
    if (fileInput.value?.files?.[0] && taskId) {
      const formData = new FormData()
      formData.append('file', fileInput.value.files[0])
      formData.append('taskId', String(taskId))
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    toast.success('Задачу успішно створено!')
    router.push('/dashboard/tasks')
  } catch (err: any) {
    console.error(err)
    serverError.value = err.response?.data?.message || 'Помилка створення'
  }
})

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFileName = ref('')

// Функція, яка викликається при виборі файлу
const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    selectedFileName.value = file.name
    
    // Тут логіка залежить від бекенду:
    // 1. Якщо шлемо файл: values.attachment = file
    // 2. Якщо шлемо URL: завантажуємо на сервер і отримуємо лінк
  }
}

// Функція для очищення файлу
const clearFile = () => {
  selectedFileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
    <ErrorMessage v-if="serverError" :message="serverError" />
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Додати завдання</h1>

    <form @submit.prevent="onSubmit" class="bg-white rounded-lg shadow p-6 space-y-4">

      <Field name="title" v-slot="{ field }">
        <input
          v-bind="field"
          class="w-full border p-2 rounded"
          placeholder="Введіть назву"
        />
        
      </Field>

      <Field name="description" v-slot="{ field }">
        <textarea
          v-bind="field"
          class="w-full border p-2 rounded"
          placeholder="Опис"
        />
      </Field>

      <Field name="priority" v-slot="{ field }">
        <select v-bind="field" class="w-full border p-2 rounded">
          <option disabled value="">Оберіть пріоритет</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
        </select>
      </Field>

      <Field name="dueDate" v-slot="{ field }">
        <input type="date" v-bind="field" class="w-full border p-2 rounded" />
      </Field>

     <Field name="timeSpent" v-slot="{ field }">
  <div class="flex gap-2">
    <input
      v-bind="field"
      type="number"
      min="0"
      class="w-full border p-2 rounded"
      placeholder="Витрачений час"
    />
    <select v-model="timeUnit" class="border p-2 rounded w-32">
      <option value="seconds">Секунди</option>
      <option value="minutes">Хвилини</option>
      <option value="hours">Години</option>
    </select>
  </div>
</Field>

      <Field name="attachment" v-slot="{ handleChange }">
  <div class="space-y-2">
    <label class="block text-sm font-medium text-brand-text-main">Вкладення</label>
    
    <div class="flex items-center gap-3">
      <input
        type="file"
        ref="fileInput"
        class="hidden"
        @change="(e) => {
          onFileChange(e);
          // Передаємо файл у vee-validate (якщо треба валідувати розмір/тип)
          handleChange((e.target as HTMLInputElement).files?.[0]);
        }"
      />

      <button
        type="button"
        @click="fileInput?.click()"
        class="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-brand-matcha-dark text-brand-text-main rounded-xl hover:bg-brand-matcha/30 transition-all"
      >
        <span>📎</span>
        {{ selectedFileName ? 'Змінити файл' : 'Обрати файл' }}
      </button>

      <div v-if="selectedFileName" class="flex items-center gap-2 text-sm bg-brand-rose/40 px-3 py-1 rounded-lg border border-brand-rose-dark/30">
        <span class="truncate max-w-[200px]">{{ selectedFileName }}</span>
        <button type="button" @click="clearFile" class="text-rose-500 font-bold hover:scale-110">✕</button>
      </div>
    </div>
  </div>
</Field>

      <Field name="categoryId" v-slot="{ field }">
        <select v-bind="field" class="w-full border p-2 rounded">
          <option :value="null">Оберіть категорію</option>
          <option
            v-for="c in categoriesStore.categories"
            :key="c.id"
            :value="c.id"
          >
            {{ c.name }}
          </option>
        </select>
      </Field>

      <Field name="completed" v-slot="{ field }">
        <label class="flex items-center gap-2">
          <input type="checkbox" v-bind="field" />
          Завдання виконано
        </label>
      </Field>


      <div class="flex gap-4 mt-4">
        <Button type="submit" class="bg-pink-500 text-white px-4 py-2 rounded">
          Створити
        </Button>
        <Button
          type="button"
          class="bg-gray-300 px-4 py-2 rounded"
          @click="router.push('/dashboard/tasks')"
        >
          Скасувати
        </Button>
      </div>
    </form>

    <pre v-if="Object.keys(errors).length" class="text-xs text-red-500 mt-4">
{{ errors }}
    </pre>
  </div>
</template>
