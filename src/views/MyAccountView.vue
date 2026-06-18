<script>
import { useNotification } from "@/useNotification";

export default {
  props: ["session"],

  data() {
    return {
      previewImage: null,
      selectedImageFile: null,
      myTickets: [],
      isUploadingImage: false
    };
  },

  setup() {
    const { showNotification } = useNotification();
    return { showNotification };
  },

  async created() {
    await this.getMyTickets();
  },

  beforeUnmount() {
    if (this.previewImage) {
      URL.revokeObjectURL(this.previewImage);
    }
  },

  methods: {
    async getMyTickets() {
      try {
        const response = await fetch("/api/tickets/my-tickets", {
          method: "GET",
          headers: {
            token: this.session.token
          }
        });

        if (response.ok) {
          this.myTickets = await response.json();
        } else if (response.status === 401) {
          this.$emit("logout");
        } else {
          this.showNotification("Failed to load your tickets", "danger");
        }
      } catch (error) {
        console.error(error);
        this.showNotification("Failed to load your tickets", "danger");
      }
    },

    onProfileImageChange(event) {
      const file = event.target.files[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        this.showNotification("Please choose an image file", "warning");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.showNotification("Image must be smaller than 2MB", "warning");
        return;
      }

      if (this.previewImage) {
        URL.revokeObjectURL(this.previewImage);
      }

      this.selectedImageFile = file;
      this.previewImage = URL.createObjectURL(file);
      this.showNotification("Profile picture selected", "success");
    },

    async uploadProfileImage() {
      if (!this.selectedImageFile) {
        this.showNotification("Please choose an image first", "warning");
        return;
      }

      this.isUploadingImage = true;

      try {
        const formData = new FormData();
        formData.append("file", this.selectedImageFile);

        const response = await fetch("/api/accounts/profile-picture", {
          method: "POST",
          headers: {
            token: this.session.token
          },
          body: formData
        });

        if (response.ok) {
          this.showNotification("Profile picture uploaded successfully", "success");
          this.selectedImageFile = null;
        } else if (response.status === 401) {
          this.$emit("logout");
        } else {
          this.showNotification("Failed to upload profile picture", "danger");
        }
      } catch (error) {
        console.error(error);
        this.showNotification("Network error during image upload", "danger");
      } finally {
        this.isUploadingImage = false;
      }
    },

    countTicketsByStatus(status) {
      return this.myTickets.filter(
          (ticket) => ticket.metadata && ticket.metadata.status === status
      ).length;
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

    <div class="row g-4">
      <div class="col-md-4">
        <div class="card shadow-sm p-4 text-center">
          <label class="avatar-upload mx-auto">
            <input
                type="file"
                accept="image/*"
                hidden
                @change="onProfileImageChange"
            />

            <div class="avatar-wrapper">
              <img
                  v-if="previewImage"
                  :src="previewImage"
                  alt="Profile picture"
                  class="avatar-image"
              />

              <div v-else class="avatar-placeholder">
                <span class="avatar-icon">👤</span>
              </div>

              <div class="avatar-overlay">
                <span class="plus-icon">+</span>
                <span class="overlay-text">Add photo</span>
              </div>
            </div>
          </label>

          <h4 class="mt-3 mb-1">{{ session.username }}</h4>
          <span class="badge bg-secondary text-uppercase">{{ session.role }}</span>

          <button
              v-if="selectedImageFile"
              class="btn btn-primary mt-3"
              :disabled="isUploadingImage"
              @click="uploadProfileImage"
          >
            {{ isUploadingImage ? "Uploading..." : "Save Profile Picture" }}
          </button>
        </div>
      </div>

      <div class="col-md-8">
        <div class="card shadow-sm p-4 mb-4">
          <h4 class="mb-3">Account Information</h4>

          <div class="row mb-2">
            <div class="col-sm-4"><strong>Username:</strong></div>
            <div class="col-sm-8">{{ session.username }}</div>
          </div>

          <div class="row mb-2">
            <div class="col-sm-4"><strong>Role:</strong></div>
            <div class="col-sm-8 text-capitalize">{{ session.role }}</div>
          </div>

          <div class="row">
            <div class="col-sm-4"><strong>Status:</strong></div>
            <div class="col-sm-8">Active</div>
          </div>
        </div>

        <div class="card shadow-sm p-4">
          <h4 class="mb-3">My Ticket Activity</h4>

          <div class="row text-center">
            <div class="col-md-3 col-6 mb-3">
              <div class="stat-box">
                <h3>{{ myTickets.length }}</h3>
                <p>Total</p>
              </div>
            </div>

            <div class="col-md-3 col-6 mb-3">
              <div class="stat-box">
                <h3>{{ countTicketsByStatus('OPEN') }}</h3>
                <p>Open</p>
              </div>
            </div>

            <div class="col-md-3 col-6 mb-3">
              <div class="stat-box">
                <h3>{{ countTicketsByStatus('IN_PROGRESS') }}</h3>
                <p>In Progress</p>
              </div>
            </div>

            <div class="col-md-3 col-6 mb-3">
              <div class="stat-box">
                <h3>{{ countTicketsByStatus('RESOLVED') }}</h3>
                <p>Resolved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row mt-3" v-if="selectedImageFile">
      <div class="col">
        <div class="alert alert-info mb-0">
          Image selected: <strong>{{ selectedImageFile.name }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-upload {
  cursor: pointer;
  display: inline-block;
}

.avatar-wrapper {
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  background: #e9ecef;
  border: 3px solid #ced4da;
}

.avatar-image,
.avatar-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f3f5;
}

.avatar-icon {
  font-size: 58px;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: 0.2s ease;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.plus-icon {
  font-size: 36px;
  font-weight: bold;
  line-height: 1;
}

.overlay-text {
  font-size: 14px;
  margin-top: 4px;
}

.stat-box {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
}

.stat-box h3 {
  margin: 0;
  color: #11af91;
}

.stat-box p {
  margin: 6px 0 0;
  color: #6c757d;
}
</style>