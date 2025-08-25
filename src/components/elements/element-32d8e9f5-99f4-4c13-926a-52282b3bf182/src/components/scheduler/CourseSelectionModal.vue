<template>
    <div class="modal-overlay" @click="cancelSelection">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h3>Select Course for {{ dayName }} - {{ periodName }}</h3>
                <button @click="cancelSelection" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
                <!-- Course Search -->
                <div class="search-box">
                    <input
                        v-model="courseSearchTerm"
                        type="text"
                        placeholder="Search courses..."
                        class="search-input"
                    />
                </div>

                <!-- Available Courses List -->
                <div class="course-list">
                    <div
                        v-for="course in filteredCourses"
                        :key="course.id"
                        class="course-item"
                        @click="selectCourse(course)"
                    >
                        <div class="course-info">
                            <div class="course-name">{{ course.name || course.course_name || course.title }}</div>
                            <div class="course-details">
                                <span v-if="course.course_code" class="course-code">{{ course.course_code }}</span>
                                <span v-if="course.subject_name" class="course-subject">{{ course.subject_name }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="filteredCourses.length === 0" class="no-courses">
                    <p>No courses available for this time slot.</p>
                    <p class="help-text">Try adjusting the filters or check the course scheduling constraints.</p>
                </div>
            </div>

            <div class="modal-footer">
                <button @click="cancelSelection" class="cancel-btn">Cancel</button>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
    name: 'CourseSelectionModal',
    props: {
        dayId: {
            type: Number,
            required: true,
        },
        dayName: {
            type: String,
            required: true,
        },
        periodId: {
            type: String,
            required: true,
        },
        periodName: {
            type: String,
            required: true,
        },
        availableCourses: {
            type: Array,
            default: () => [],
        },
    },
    emits: ['submit', 'cancel'],
    setup(props, { emit }) {
        const courseSearchTerm = ref('');

        const filteredCourses = computed(() => {
            if (!courseSearchTerm.value) {
                return props.availableCourses;
            }

            const search = courseSearchTerm.value.toLowerCase();
            return props.availableCourses.filter(course => {
                return (
                    (course.name && course.name.toLowerCase().includes(search)) ||
                    (course.course_name && course.course_name.toLowerCase().includes(search)) ||
                    (course.title && course.title.toLowerCase().includes(search)) ||
                    (course.course_code && course.course_code.toLowerCase().includes(search)) ||
                    (course.subject_name && course.subject_name.toLowerCase().includes(search)) ||
                    (course.description && course.description.toLowerCase().includes(search))
                );
            });
        });

        function selectCourse(course) {
            emit('submit', {
                courseId: course.id,
                courseName: course.name || course.course_name || course.title,
                courseCode: course.course_code,
                dayId: props.dayId,
                periodId: props.periodId,
            });
        }

        function cancelSelection() {
            emit('cancel');
        }

        onMounted(() => {
            // Focus search input when modal opens
            setTimeout(() => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);
        });

        return {
            courseSearchTerm,
            filteredCourses,
            selectCourse,
            cancelSelection,
        };
    },
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #666;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: #333;
}

.modal-body {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
}

.search-box {
    margin-bottom: 16px;
}

.search-input {
    width: 100%;
    padding: 10px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
}

.search-input:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.course-list {
    max-height: 300px;
    overflow-y: auto;
}

.course-item {
    padding: 12px;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.course-item:hover {
    background-color: #f5f5f5;
    border-color: #1890ff;
}

.course-item:last-child {
    margin-bottom: 0;
}

.course-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.course-name {
    font-weight: 500;
    color: #333;
    font-size: 14px;
}

.course-details {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #666;
}

.course-code {
    font-family: monospace;
    background-color: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
}

.course-subject {
    color: #1890ff;
}

.no-courses {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.no-courses p {
    margin: 0 0 8px 0;
}

.help-text {
    font-size: 12px;
    color: #999;
}

.modal-footer {
    padding: 16px 20px;
    border-top: 1px solid #e8e8e8;
    display: flex;
    justify-content: flex-end;
}

.cancel-btn {
    padding: 8px 16px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background: white;
    color: #666;
    cursor: pointer;
    font-size: 14px;
}

.cancel-btn:hover {
    border-color: #1890ff;
    color: #1890ff;
}
</style>
