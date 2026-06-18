<script>
export default {
  props: ['session']
}
</script>

<template>
  <nav class="nav flex-column">
    <div class="navbarCSS" style="height: 100vh;">
      <button
          class="btn btn-navbar mb-2" @click="$emit('switch-page', 'my-account')">
        <img src="/icons/profileIcon.png" alt="Accounts" style="height: 40px;">
        Account
      </button>


      <button v-if="this.session.role === 'support' " class="btn btn-navbar mb-2"
              @click="$emit('switch-page', 'dashboard')">
        <img src="/icons/dashboard.png" alt="Accounts" style="height: 30px;">
        Dashboard
      </button>

      <button v-if="this.session.role === 'support' " class="btn btn-navbar mb-2"
              @click="$emit('switch-page', 'accounts')">
        <img src="/icons/users icon.png" alt="Accounts" style="height: 30px;">
        Accounts
      </button>


      <button
          class="btn btn-navbar mb-2" @click="$emit('switch-page', 'tickets')">
        <img src="/icons/tickets.png" alt="Accounts" style="height: 30px;">
        Tickets
      </button>

      <button
          class="btn btn-navbar mb-2" @click="$emit('switch-page', 'audits')">
        <img src="/icons/tickets.png" alt="Accounts" style="height: 30px;">
        Audits
      </button>

      <button
          class="btn btn-navbar" @click="$emit('logout')">
        <img src="/icons/logOut.png" alt="Accounts" style="height: 30px;">
        Log Out
      </button>
      <img class="navbar-bottom" src="/platypusDark.png" alt="" style="height: 140px;">
    </div>

  </nav>
</template>
