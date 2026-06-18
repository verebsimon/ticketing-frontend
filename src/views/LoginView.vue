<script>

import { useNotification } from '@/useNotification';

export default {

  props: ['validAccounts'],

  data() {
    return {
      username: '',
      password: ''
    }
  },

  setup() {
    const {showNotification} = useNotification();
    return {showNotification};
  },

  methods: {
    async handleLogin() {
      if(this.username === '' && this.password === '') {
        this.showNotification('Please enter both Username and Password', 'warning');
        return;
      }

      try {
        const response = await fetch("/api/accounts/login", {
          method: "GET",
          headers: {
            "CredentialsUsername": this.username,
            "CredentialsPassword": this.password
          }

        })

        if(response.ok) {
          const responseData = await response.json();
          this.showNotification(`Welcome ${this.username}!`, 'success');
          this.$emit('login-success', this.username, responseData.role, responseData.sessionToken);
        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("Invalid Username or Password", 'danger');
        }

      }
      catch(error) {
        console.error("Network Error: ", error)
        this.showNotification("Network communication failure!", 'danger');
      }

    }
  }
}
</script>

<template>
  <div class="pageBG">
    <div class="position-absolute start-50 translate-middle-x">
      <div class="outlineGreen rounded padding">
        <div>

          <div>
            <div class="container">
              <img src='/Ticketing.png' alt="emagiz logo" width="400">

              <div>
                <label>Username:</label>
                <input class="form-control" type="username" placeholder="Enter username" v-model="username">
              </div>

              <br>

              <div>
                <label>Password:</label>
                <input class="form-control" type="password" placeholder="Enter password" v-model="password">
              </div>

              <br>
              <h1></h1></div>
          </div>
          <button class="btn btn-primary" style="width:100%" @click="handleLogin">Sign in</button>
        </div>


      </div>
    </div>
  </div>
</template>

<style scoped>
.pageBG {
  background-image: url('/emagiz-background.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  min-height: 100vh;
  width: 100%;
}
</style>
