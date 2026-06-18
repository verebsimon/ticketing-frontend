<script>
import { useNotification } from '@/useNotification';

export default {

  props: ['session'],

  data() {
    return {
      accounts: [],
      customers: [],

      companies: [],
      selectedCompanyId: null,

      newUsername: '',
      newRole: 'customer',
      newPassword: '',
      newEmail: '',

      newCompanyName: ''
    }
  },

  setup() {
    const {showNotification} = useNotification();
    return {showNotification};
  },


  async created() {
    await this.getAccounts();
    await this.getCompanies();
  },

  methods: {
    async getTickets() {
      try {
        const response = await fetch('/api/tickets/my-tickets', {
          method: "GET",
          headers: {
            "token": this.session.token
          }
        });

        if(response.ok) {
          this.tickets = await response.json();
        }
        else if(response.status === 401) this.$emit('logout');

      }
      catch(error) {
        console.error(error);
        this.showNotification("Failed to get tickets", "danger");
      }

    },
    async getAccounts() {
      try {
        const response = await fetch('api/accounts', {
          method: "GET",
          headers: {
            "token": this.session.token
          }
        });

        if(response.ok) {
          this.accounts = await response.json();
        }
        else if(response.status === 401) this.$emit('logout');

      }
      catch(error) {
        console.error(error);
        this.showNotification("Failed to get accounts", "danger");
      }
    },

    async createNewAccount() {
      if(this.newUsername === '' || this.newEmail === '' || this.newPassword === '') {
        this.showNotification("Please fill all fields", "warning");
        return;
      }

      if(this.newRole === 'customer') {
        this.newRole = 0;
      }
      else if(this.newRole === 'consultant') {
        this.newRole = 1;
      }
      else if(this.newRole === 'support') {
        this.newRole = 2;
      }

      const userCreated = {
        username: this.newUsername,
        passwordHash: this.newPassword,
        email: this.newEmail,
        permissionLevel: this.newRole,
        companyId: this.selectedCompanyId
      };

      const response = await fetch('/api/accounts', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": this.session.token
        },
        body: JSON.stringify(userCreated)
      })

      if(response.ok) {
        this.showNotification("Account created successfully!", "success");
        await this.getAccounts();
      }
      else if(response.status === 401) this.$emit('logout');

      else {
        this.showNotification("Failed to create account.", "danger");
      }

      this.newUsername = '';
      this.newPassword = '';
      this.newEmail = '';
      this.selectedCompanyId = null;
    },

    async getCustomers() {
      try {
        const response = await fetch('api/accounts/customers', {
          method: "GET"
        })

        if(response.ok) {
          this.customers = await response.json();
        }
        else if(response.status === 401) this.$emit('logout');

      }
      catch(error) {
        console.error(error);
        this.showNotification("Failed to get customers!", "danger");
      }
    },
    async deleteAccount(accountId) {
      if(!confirm("Are you sure you want to delete this account?")) {
        return;
      }

      try {
        const response = await fetch(`/api/accounts/${accountId}`, {
          method: "DELETE",
          headers: {
            "token": this.session.token
          }
        });

        if(response.ok) {
          this.showNotification("Account deleted successfully.", "success");
          this.accounts = this.accounts.filter(acc => acc.id !== accountId);
        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("Backend rejected account deletion.", "danger");
        }
      }
      catch(error) {
        console.error("Error deleting account:", error);
        this.showNotification("Network error occurred while trying to delete account.", "danger");
      }
    },

    async getCompanies() {
      try {
        const response = await fetch('/api/companies', {
          method: "GET",
          headers: {
            "token": this.session.token
          }
        });
        if(response.ok) {
          this.companies = await response.json();
        }
        else if(response.status === 401) this.$emit('logout');
      }
      catch(error) {
        console.error("Error loading companies:", error);
        this.showNotification("Failed to get companies", "danger");
      }
    },

    async createNewCompany() {
      if(this.newCompanyName.trim() === '') {
        this.showNotification("Please fill in company name", "warning")
        return;
      }
      const companyPayload = {
        name: this.newCompanyName
      };
      try {
        const response = await fetch('/api/companies', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.session.token
          },
          body: JSON.stringify(companyPayload)
        });

        if(response.ok) {
          this.showNotification("Company created successfully!", "success");
          this.newCompanyName = '';

          await this.getCompanies();

        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("Failed to create company.", "danger");
        }
      }
      catch(error) {
        console.error(error);
        this.showNotification("Network error occurred while creating company.", "danger");
      }
    }
  }
}
</script>


<template>
  <div class="container mt-2">
    <div class="col"><h1>Accounts overview</h1>
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newAccountModal">
        Add New Account
      </button>

      <!--account popup-->
      <div class="modal fade" id="newAccountModal" tabindex="-1" role="dialog" aria-labelledby=" " aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="newAccountModalLabel">Create New Account</h5>

            </div>
            <div class="modal-body">
              <div v-if="this.session.role === 'support'">

                <div class="container pb-3">
                  <div class="row">
                    <div class="col">
                      <label>New User Name: </label>
                      <input class="form-control" type="username" placeholder="username123" v-model="newUsername">
                      <label>New Password: </label>
                      <input class="form-control" type="password" placeholder="Password" v-model="newPassword">
                      <label>New Email </label>
                      <input class="form-control" type="email" placeholder="example@mail.com" v-model="newEmail">

                    </div>
                    <div class="col">
                      <label> Assign Role </label>
                      <select class="btn btn-secondary" v-model="newRole">
                        <option value="customer">Customer</option>
                        <option value="consultant">Consultant</option>
                        <option value="support">Support</option>

                      </select>
                      <label> Assign Company </label>
                      <select class="btn btn-secondary" v-model="selectedCompanyId">
                        <option :value="null" disabled>-- Select Company --</option>
                        <option v-for="company in companies" :key="company.id" :value="company.id">
                          {{ company.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="container mb-3"></div>

                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" @click="createNewAccount">Create Account</button>

            </div>
          </div>
        </div>
      </div>


      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#newCompanyModal">
        Add New Company
      </button>

      <div class="modal fade" id="newCompanyModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Create New Company</h5>
            </div>
            <div class="modal-body">
              <div v-if="session.role === 'support'">
                <div class="container pb-3">
                  <div class="row">
                    <div class="col">
                      <label>Company Name: </label>
                      <input class="form-control" type="text" placeholder="Company name..." v-model="newCompanyName">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" @click="createNewCompany">Create Company</button>
            </div>
          </div>
        </div>
      </div>
      <hr>

      <!--popup end i think-->


      <div v-for="company in companies">

        <div style="margin: 13px;">
          <div class="row">
            <div class="col">
              <div id="accordion">
                <div class="card">
                  <div class="card-header" style="cursor: pointer;">
                    <h4 class="mb-0">
                      <div class="container" data-bs-toggle="collapse" :data-bs-target="`#collapse-${company.id}`">
                        {{ company.name }}
                      </div>
                    </h4>
                  </div>

                  <div :id="`collapse-${company.id}`" class="collapse" data-bs-parent="#accordion">
                    <div v-for="account in accounts">
                      <div class="card-body" v-if="account.company===company.name">
                        <div class="basicFrame">
                          <div class="row">
                            <div class="col">
                              <table>
                                <tbody>
                                <tr>
                                  <td>Username:</td>
                                  <td><b>{{ account.username }}</b></td>
                                </tr>
                                <tr>
                                  <td>Email:</td>
                                  <td>{{ account.email }}</td>
                                </tr>
                                <tr>
                                  <td>Role:</td>
                                  <td>{{ account.permissionLevel }}</td>
                                </tr>

                                </tbody>
                              </table>
                            </div>
                            <div class="col d-flex justify-content-center align-items-center">
                              <button type="button" class="btn btn-danger" @click="deleteAccount(account.id)">Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
