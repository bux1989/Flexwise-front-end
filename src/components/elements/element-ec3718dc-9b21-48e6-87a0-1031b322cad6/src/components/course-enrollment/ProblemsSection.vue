<template>
  <div v-if="unresolvedProblems.length > 0" class="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
    <h3 class="text-red-800 font-medium mb-2 flex items-center gap-2">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      Problems Requiring Resolution ({{ unresolvedProblems.length }})
    </h3>
    
    <div class="space-y-2">
      <div 
        v-for="note in unresolvedProblems" 
        :key="note.id" 
        class="flex items-start justify-between bg-white p-2 rounded border border-red-200"
      >
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-red-700">{{ getCourseName(note.course_id) }}</span>
            <span class="text-xs text-red-600">{{ note.author }}</span>
            <span class="text-xs text-red-500">{{ formatDate(note.created_at) }}</span>
          </div>
          <p class="text-red-800 text-sm">{{ note.text }}</p>
        </div>
        <button
          @click="$emit('resolve-note', note.id)"
          class="ml-3 h-6 px-3 py-1 bg-green-100 text-green-700 text-xs hover:bg-green-200 border-0 rounded transition-colors"
        >
          Resolve
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  courseNotes: {
    type: Array,
    default: () => []
  },
  courses: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['resolve-note'])

// Computed properties
const unresolvedProblems = computed(() => {
  return props.courseNotes.filter(note => note.is_problem && !note.is_resolved)
})

// Helper functions
const getCourseName = (courseId) => {
  const course = props.courses.find(c => c.id === courseId)
  return course?.name || 'Unknown Course'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>
