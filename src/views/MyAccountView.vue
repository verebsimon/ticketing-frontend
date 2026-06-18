<script>
import { useNotification } from "@/useNotification";

export default {
  props: ["session"],

  data() {
    return {
      isEditingCredentials: false,
      isSavingCredentials: false,
      accountForm: {
        username: "",
        password: "",
        confirmPassword: ""
      },
      displayedUsername: ""
    };
  },

  setup() {
    const { showNotification } = useNotification();
    return { showNotification };
  },

  created() {
    this.displayedUsername = this.session.username;
    this.resetAccountForm();
  },

  methods: {
    resetAccountForm() {
      this.accountForm = {
        username: this.displayedUsername || this.session.username || "",
        password: "",
        confirmPassword: ""
      };
    },

    startEditingCredentials() {
      this.resetAccountForm();
      this.isEditingCredentials = true;
    },

    cancelEditingCredentials() {
      this.resetAccountForm();
      this.isEditingCredentials = false;
    },

    async saveCredentials() {
      if (!this.accountForm.username.trim()) {
        this.showNotification("Username cannot be empty", "warning");
        return;
      }

      if (
        this.accountForm.password &&
        this.accountForm.password !== this.accountForm.confirmPassword
      ) {
        this.showNotification("Passwords do not match", "warning");
        return;
      }

      this.isSavingCredentials = true;

      try {
        const payload = {
          username: this.accountForm.username.trim()
        };

        if (this.accountForm.password.trim()) {
          payload.password = this.accountForm.password;
        }

        const response = await fetch("/api/accounts/credentials", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token: this.session.token
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          this.displayedUsername = this.accountForm.username.trim();
          this.isEditingCredentials = false;
          this.resetAccountForm();
          this.showNotification("Credentials updated successfully", "success");
        } else if (response.status === 401) {
          this.$emit("logout");
        } else {
          this.showNotification("Failed to update credentials", "danger");
        }
      } catch (error) {
        console.error(error);
        this.showNotification("Network error while updating credentials", "danger");
      } finally {
        this.isSavingCredentials = false;
      }
    }
  }
};
</script>

<template>
  <div class="container mt-3">
    <div class="row mb-4">
      <div class="col">
        <h1>My Account</h1>
      </div>
    </div>

    <div class="row">
      <div class="col-md-8">
        <div class="card shadow-sm p-4 mb-4">
          <div class="section-header-green d-flex justify-content-between align-items-center">
            <h4 class="mb-0">Account Information</h4>

            <button
              v-if="!isEditingCredentials"
              class="btn btn-orange btn-sm"
              @click="startEditingCredentials"
            >
              Edit
            </button>
          </div>

          <div class="row mb-3">
            <div class="col-sm-4"><strong>Username:</strong></div>
            <div class="col-sm-8">
              <span v-if="!isEditingCredentials">{{ displayedUsername }}</span>
              <input
                v-else
                v-model="accountForm.username"
                type="text"
                class="form-control"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-sm-4"><strong>New Password:</strong></div>
            <div class="col-sm-8">
              <span v-if="!isEditingCredentials">********</span>
              <input
                v-else
                v-model="accountForm.password"
                type="password"
                class="form-control"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div class="row mb-3" v-if="isEditingCredentials">
            <div class="col-sm-4"><strong>Confirm Password:</strong></div>
            <div class="col-sm-8">
              <input
                v-model="accountForm.confirmPassword"
                type="password"
                class="form-control"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div class="row mb-2">
            <div class="col-sm-4"><strong>Role:</strong></div>
            <div class="col-sm-8 text-capitalize">{{ session.role }}</div>
          </div>

          <div class="row mb-3">
            <div class="col-sm-4"><strong>Status:</strong></div>
            <div class="col-sm-8">Active</div>
          </div>

          <div v-if="isEditingCredentials" class="d-flex gap-2 flex-wrap mt-3">
            <button
              class="btn btn-success"
              :disabled="isSavingCredentials"
              @click="saveCredentials"
            >
              {{ isSavingCredentials ? "Saving..." : "Save" }}
            </button>

            <button
              class="btn btn-secondary"
              :disabled="isSavingCredentials"
              @click="cancelEditingCredentials"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-orange {
  background-color: #ef692a;
  border-color: #cd501f;
  color: white !important;
}

.btn-orange:hover {
  background-color: #cd501f;
  border-color: #cd501f;
  color: white !important;
}

.section-header-green {
  background-color: #11af91;
  color: white;
  padding: 12px 16px;
  border-radius: 10px;
  margin: -1rem -1rem 1rem -1rem;
}
</style>
