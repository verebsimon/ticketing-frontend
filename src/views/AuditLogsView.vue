<script>
import { useNotification } from '@/useNotification';

export default {
  props: ['session'],

  data() {
    return {
      auditLogs: [],
      pageIndex: 0
    };
  },

  setup() {
    const {showNotification} = useNotification();
    return {showNotification};
  },

  async created() {
    await this.getAuditLogs(0);
  },

  methods: {
    async getAuditLogs(direction) {
      try {
        const response = await fetch('/api/audit/logs', {
          method: "GET",
          headers: {
            "token": this.session.token,
            "pageSize": "15",
            "pageIndex": this.pageIndex + direction
          }
        });

        if(response.ok) {
          this.auditLogs = await response.json();
          this.pageIndex += direction;
        }
        else if(response.status === 403) {
          this.showNotification("Access denied. Support permission required.", "danger");
        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("Failed to retrieve system audit logs", "danger");
        }
      }
      catch(error) {
        console.error(error);
        this.showNotification("Failed to reach audit log database", "danger");
      }
    },

    nextAuditPage() {
      this.getAuditLogs(1);
    },

    previousAuditPage() {
      if(this.pageIndex > 0) {
        this.getAuditLogs(-1);
      }
      else {
        this.showNotification("This is the most recent page", "warning")
      }
    }
  }
}
</script>

<template>
  <div>
    <h1>System Audit Logs</h1>

    <ul>
      <li v-for="log in auditLogs" :key="log.id">
        ID: {{ log.auditLogId }} | User: {{ log.actorId }} | Action: {{ log.action }} | Time: {{ log.timestamp }} |
        {{ log.details }}
      </li>
    </ul>

    <p v-if="auditLogs.length === 0">No audit logs found.</p>

    <button @click="previousAuditPage">DONT CLICK ME</button>

    <button @click="nextAuditPage">CLICK ME</button>
  </div>
</template>
