<script>
import NotificationCenter from './components/NotificationCenter.vue';
import AccountView from './views/AccountView.vue';
import LoginView from './views/LoginView.vue';
import TicketDetailView from './views/TicketDetailView.vue';
import TicketListView from './views/TicketListView.vue';
import Navbar from './components/Navbar.vue';
import MyAccountView from './views/MyAccountView.vue';
import Dashboard from './views/Dashboard.vue';
import AuditLogsView from './views/AuditLogsView.vue';

export default {
  components: {
    Navbar,
    LoginView,
    TicketListView,
    NotificationCenter,
    AccountView,
    TicketDetailView,
    MyAccountView,
    Dashboard,
    AuditLogsView
  },
  data() {
    return {
      currentView: 'login',
      session: {
        username: '',
        role: '',
        token: ''
      },
      selectedTicket: null
    }
  },
  methods: {
    completeLogin(username, role, sessionToken) {
      this.session.username = username;
      this.session.role = role.toLowerCase();
      this.session.token = sessionToken;
      this.currentView = 'tickets';
    },

    handleLogout() {
      this.session = {
        username: '',
        role: '',
        token: ''
      };
      this.currentView = 'login';
    },

    switchPage(page) {
      this.currentView = page;
    },

    openTicketDetails(ticket) {
      this.selectedTicket = ticket;
      this.currentView = 'ticket-detail';
    },

    closeTicketDetails() {
      this.selectedTicket = null;
      this.currentView = 'tickets';
    }
  }
}
</script>

<template>
  <div class="app-container">
    <NotificationCenter/>

    <LoginView v-if="currentView === 'login'" @login-success="completeLogin"/>

    <div v-else class="container-fluid">
      <div class="row">
        <div style="width: 100px; padding: 0;">
          <Navbar
              :session="session"
              @switch-page="switchPage"
              @logout="handleLogout"
          />
        </div>

        <div class="col p-0">
          <TicketListView v-if="currentView === 'tickets'"
                          :session="session"
                          @logout="handleLogout"
                          @switch-page="switchPage"
                          @select-ticket="openTicketDetails"
          />
          <Dashboard v-if="currentView === 'dashboard'"
                     :session="session"
                     @logout="handleLogout"
                     @switch-page="switchPage"
                     @select-ticket="openTicketDetails"
          />

          <AccountView v-if="currentView === 'accounts'"
                       :session="session"
                       @logout="handleLogout"
                       @switch-page-accounts="switchPage"
          />

          <TicketDetailView v-if="currentView === 'ticket-detail' && session.username"
                            :ticket="selectedTicket"
                            :session="session"
                            @back="closeTicketDetails"
          />

          <MyAccountView v-if="currentView === 'my-account'"
                         :session="session"
                         @back="currentView = 'tickets'"
          />

          <AuditLogsView v-if="currentView === 'audits'"
                         :session="session"
                         @back="currentView = 'tickets'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
