<template>
  <div class="notification-container" style="position: fixed; top: 20px; right: 20px; z-index: 1060; min-width: 320px;">
    <TransitionGroup name="notification-list">
      <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['alert', 'fade', 'show', 'd-flex', 'align-items-center', `alert-${notification.type}`]"
          role="alert"
          style="box-shadow: 0 4px 12px rgba(0,0,0,0.2); margin-bottom: 10px; padding-right: 1rem;"
      >
        <div>
          <strong>
            {{
              notification.type === 'danger' ? 'Error!' : notification.type.charAt(0).toUpperCase() + notification.type.slice(1) + '!'
            }}
          </strong>
          {{ notification.message }}
        </div>
        <button
            type="button"
            @click="dismissNotification(notification.id)"
            class="btn-close ms-auto"
            style="background: none; border: none; font-size: 1.3rem; cursor: pointer; line-height: 1; padding: 0; color: inherit;"
        >
          &times;
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { useNotification } from '../useNotification.js';

export default {
  setup() {
    const {notifications, dismissNotification} = useNotification();
    return {notifications, dismissNotification};
  }
}
</script>


<style scoped>
/* State when entering the screen: slide in from right and start invisible */
.notification-list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

/* State when leaving the screen: disappear smoothly and slide right slightly */
.notification-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Smooth timing rules applied to entering and exiting phases */
.notification-list-enter-active,
.notification-list-leave-active {
  transition: all 0.4s ease;
}

/* Ensures other notifications smoothly shift up when an item above disappears */
.notification-list-move {
  transition: transform 0.4s ease;
}
</style>
