<template>
    <div class="skeleton-cell-container">
        <div class="skeleton-loader"></div>
    </div>
</template>

<script>
export default {
    name: 'SkeletonCellRenderer'
}
</script>

<style scoped>
.skeleton-cell-container {
    display: flex;
    align-items: center;
    height: 100%;
    width: 100%;
    padding: 8px 0;
}

.skeleton-loader {
    height: 14px;
    background-color: #a19b9d4d;
    border-radius: 2px;
    width: 100%;
    animation: skeleton-wave 1.5s ease-in-out infinite;
    position: relative;
    overflow: hidden;
}

.skeleton-loader::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent);
    animation: skeleton-wave 1.5s ease-in-out 0.5s infinite;
}

@keyframes skeleton-wave {
    0% {
        background-position: -200px 0;
    }

    100% {
        background-position: calc(200px + 100%) 0;
    }
}
</style>