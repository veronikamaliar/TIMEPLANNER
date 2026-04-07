<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm, Field } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { taskSchema, type TaskFormData } from '@/schemas/task.schema'
import { useTasksStore } from '@/stores/tasksStore'
import { useCategoriesStore } from '@/stores/categoriesStore'
import { toast } from 'vue3-toastify'
import Button from '@/components/common/Button.vue'
import { toSeconds, fromSeconds } from '@/utils/time'


const route = useRoute()
const router = useRouter()

const taskId = Number(route.params.id)

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()
const serverError = ref('')

const timeUnit = ref<'seconds' | 'minutes' | 'hours'>('minutes')

const { handleSubmit, errors, setValues } = useForm<TaskFormData>({
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



onMounted(async () => {
  await categoriesStore.fetchCategories()

  const task = await tasksStore.fetchTaskById(taskId)

  if (!task) return

  const time = fromSeconds(task.timeSpent || 0)

  setValues({
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDate: task.dueDate?.slice(0, 10) ?? '',
    completed: task.completed,
    timeSpent: time.value, 
    attachment: task.attachment ?? '',
    categoryId: task.category?.id ?? null,
  })

  timeUnit.value = time.unit 
})

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
if (values.timeSpent?.toString().trim()) {
  payload.timeSpent = toSeconds(values.timeSpent, timeUnit.value)
}
if (values.attachment?.trim()) payload.attachment = values.attachment
if (values.categoryId !== null) payload.categoryId = Number(values.categoryId)


    console.log('Відправляємо на сервер (редагування):', payload)

    await tasksStore.updateTask(taskId, payload)
    toast.success('Задачу оновлено!')
    router.push('/dashboard/tasks')
  } catch (err: any) {
    console.error(err)
    serverError.value = err.response?.data?.message || 'Помилка редагування'
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Редагувати завдання</h1>


    <form @submit.prevent="onSubmit" class="bg-white rounded-lg shadow p-6 space-y-4">

      <!-- Назва -->
      <Field name="title" v-slot="{ field, meta }">
        <input
          v-bind="field"
          class="w-full border p-2 rounded"
          placeholder="Введіть назву"
        />
        <p v-if="meta.touched && meta.errorMessage" class="text-red-500 text-sm">
          {{ meta.errorMessage }}
        </p>
      </Field>

      <!-- Опис -->
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

      <Field name="attachment" v-slot="{ field }">
        <input
          v-bind="field"
          class="w-full border p-2 rounded"
          placeholder="URL або ім’я файлу"
        />
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
    <input
      type="checkbox"
      :checked="field.value"
      @change="field.onChange($event.target.checked)"
    />
    Завдання виконано
  </label>
</Field>


      <p v-if="serverError" class="text-red-500 text-sm">{{ serverError }}</p>

      <div class="flex gap-4 mt-4">
        <Button type="submit" class="bg-pink-500 text-white px-4 py-2 rounded">
  Редагувати завдання
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