<script>
import { useNotification } from "@/useNotification";

export default {
  props: ["session"],

  data() {
    return {
      tickets: [],
      consultants: [],

      searchId: "",

      filterType: "",
      filterStatus: "",
      filterPriority: "",

      newUsername: "",
      newRole: "customer",
      newPassword: "",
      newEmail: "",

      newTicketTitle: "",
      newTicketDescription: "",
      newTicketPriority: "LOW",
      newTicketType: "INCIDENT",

      sortingField: "",
      sortingAscending: "",

      PRIORITY_ORDER: {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
      },

      TYPE_ORDER: {
        REQUEST_FOR_CHANGE: 0,
        OTHER: 1,
        INCIDENT: 2,
      },

      STATUS_ORDER: {
        OPEN: 0,
        IN_PROGRESS: 1,
        RESOLVED: 2,
        REJECTED: 3,
      },
    };
  },

  computed: {
    filteredTickets() {
      return this.tickets.filter((ticket) => {
        if (this.searchId) {
          const ticketIdString = String(ticket.id).toLowerCase();
          const searchIdString = this.searchId.trim().toLowerCase();
          if (!ticketIdString.includes(searchIdString)) {
            return false;
          }
        }

        if (this.filterPriority && ticket.priority !== this.filterPriority) {
          return false;
        }
        if (this.filterType && ticket.type !== this.filterType) {
          return false;
        }
        if (
          this.filterStatus &&
          (!ticket.metadata || ticket.metadata.status !== this.filterStatus)
        ) {
          return false;
        }
        return true;
      });
    },
  },

  setup() {
    const { showNotification } = useNotification();
    return { showNotification };
  },

  async created() {
    await this.getTickets();
  },

  methods: {
    goToTicket(ticket) {
      this.$emit("select-ticket", ticket);
    },

    async getTickets() {
      try {
        const response = await fetch("/api/tickets/my-tickets", {
          method: "GET",
          headers: {
            token: this.session.token,
          },
        });

        if (response.ok) {
          this.tickets = await response.json();
        } else if (response.status === 401) this.$emit("logout");
      } catch (error) {
        console.error(error);
        this.showNotification("Failed to get tickets", "danger");
      }
    },

    async createNewAccount() {
      if (
        this.newUsername === "" ||
        this.newEmail === "" ||
        this.newPassword === ""
      ) {
        this.showNotification("Please fill all fields", "warning");
        return;
      }

      if (this.newRole === "customer") this.newRole = 0;
      else if (this.newRole === "consultant") this.newRole = 1;
      else if (this.newRole === "support") this.newRole = 2;

      const userCreated = {
        username: this.newUsername,
        passwordHash: this.newPassword,
        email: this.newEmail,
        permissionLevel: this.newRole,
      };

      const response = await fetch("api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: this.session.token,
        },
        body: JSON.stringify(userCreated),
      });

      if (response.ok) {
        this.showNotification("Account created successfully!", "success");
      } else if (response.status === 401) this.$emit("logout");
      else {
        this.showNotification("Failed to create account.", "danger");
      }

      this.newUsername = "";
      this.newPassword = "";
      this.newEmail = "";
    },

    async addTicket() {
      if (this.newTicketTitle === "" || this.newTicketDescription === "") {
        this.showNotification(
          "Please complete both the title and description fields",
          "warning",
        );
        return;
      }

      const freshTicket = {
        title: this.newTicketTitle,
        description: this.newTicketDescription,
        type: this.newTicketType,
        priority: this.newTicketPriority,
      };

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: this.session.token,
        },
        body: JSON.stringify(freshTicket),
      });

      if (response.ok) {
        this.showNotification("Ticket submitted successfully!", "success");
        const submitted = await response.json();
        this.tickets.push(submitted);
      } else if (response.status === 401) this.$emit("logout");
      else {
        this.showNotification("Failed to submit ticket", "danger");
      }

      this.newTicketTitle = "";
      this.newTicketDescription = "";
      this.newTicketPriority = "LOW";
      this.newTicketType = "INCIDENT";
    },

    sortTickets(field) {
      if (this.sortingField === field) {
        this.sortingAscending = !this.sortingAscending;
      } else {
        this.sortingAscending = true;
      }

      this.sortingField = field;

      this.tickets.sort((a, b) => {
        let sort = 0;
        switch (field) {
          case "creator":
            sort = (a.creatorUsername || "").localeCompare(
              b.creatorUsername || "",
            );
            break;
          case "priority":
            sort =
              this.PRIORITY_ORDER[a.priority] - this.PRIORITY_ORDER[b.priority];
            break;
          case "type":
            sort = this.TYPE_ORDER[a.type] - this.TYPE_ORDER[b.type];
            break;
          case "status":
            const statusA = a.metadata ? a.metadata.status : "";
            const statusB = b.metadata ? b.metadata.status : "";
            sort = this.STATUS_ORDER[statusA] - this.STATUS_ORDER[statusB];
            break;
        }
        return this.sortingAscending ? sort : -sort;
      });
    },
  },
};
</script>

<template>
  <div class="container p-0">
    <div>
      <div class="row">
        <div class="col"><h1 class="orange-background">All tickets</h1></div>
        <div class="col-2 d-flex justify-content-center align-items-center">
          <button
            type="button"
            class="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#newTicketModal"
          >
            <img
              src="/icons/addButton.png"
              alt="Add New Ticket"
              style="height: 35px; padding: 1px; margin: 5px"
            />
            Ticket
          </button>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4 p-2 bg-light rounded border mx-0">
      <div class="col-md-3">
        <label class="form-label small fw-bold text-muted">Search by ID</label>
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="Type ticket ID..."
          v-model="searchId"
        />
      </div>

      <div class="col-md-3">
        <label class="form-label small fw-bold text-muted"
          >Filter by Priority</label
        >
        <select
          class="form-select form-select-sm"
          v-model="filterPriority"
          style="cursor: pointer"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <div class="col-md-3">
        <label class="form-label small fw-bold text-muted"
          >Filter by Type</label
        >
        <select
          class="form-select form-select-sm"
          v-model="filterType"
          style="cursor: pointer"
        >
          <option value="">All Types</option>
          <option value="INCIDENT">Incident</option>
          <option value="REQUEST_FOR_CHANGE">Request For Change</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div class="col-md-3">
        <label class="form-label small fw-bold text-muted"
          >Filter by Status</label
        >
        <select
          class="form-select form-select-sm"
          v-model="filterStatus"
          style="cursor: pointer"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
    </div>
    <table class="table table-hover align-middle border">
      <thead>
        <tr>
          <th scope="col">Title</th>
          <th class="sorting-field" scope="col" @click="sortTickets('creator')">
            Customer
            <span v-if="sortingField === 'creator'">
              <span v-if="sortingAscending"> ^</span>
              <span v-if="!sortingAscending"> ⌄</span>
            </span>
          </th>
          <th
            class="sorting-field"
            scope="col"
            @click="sortTickets('priority')"
          >
            Priority
            <span v-if="sortingField === 'priority'">
              <span v-if="sortingAscending"> ^</span>
              <span v-if="!sortingAscending"> ⌄</span>
            </span>
          </th>
          <th
            class="sorting-field text-center"
            scope="col"
            @click="sortTickets('type')"
          >
            Type
            <span v-if="sortingField === 'type'">
              <span v-if="sortingAscending"> ^</span>
              <span v-if="!sortingAscending"> ⌄</span>
            </span>
          </th>
          <th
            class="sorting-field text-center"
            scope="col"
            @click="sortTickets('status')"
          >
            Status
            <span v-if="sortingField === 'status'">
              <span v-if="sortingAscending"> ^</span>
              <span v-if="!sortingAscending"> ⌄</span>
            </span>
          </th>
          <th scope="col">ID</th>
          <th scope="col"></th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          @click="goToTicket(ticket)"
          style="cursor: pointer"
        >
          <td>
            <b class="ticket-title">{{ ticket.title }}</b>
          </td>
          <td>{{ ticket.creatorUsername }}</td>
          <td>
            <span v-if="ticket.priority === 'LOW'"
              ><img
                src="/icons/priority/low.png"
                style="width: 25px"
                alt="Low"
              />Low</span
            >
            <span v-if="ticket.priority === 'MEDIUM'"
              ><img
                src="/icons/priority/medium.png"
                style="width: 25px"
                alt="Medium"
              />Medium</span
            >
            <span v-if="ticket.priority === 'HIGH'"
              ><img
                src="/icons/priority/high.png"
                style="width: 25px"
                alt="High"
              />High</span
            >
            <span v-if="ticket.priority === 'CRITICAL'"
              ><img
                src="/icons/priority/critical.png"
                style="width: 25px"
                alt="Critical"
              />Critical</span
            >
          </td>
          <td class="text-center">
            <span v-if="ticket.type === 'INCIDENT'" class="chip Type incident"
              >Incident</span
            >
            <span
              v-if="ticket.type === 'REQUEST_FOR_CHANGE'"
              class="chip Type RFC"
              >RFC</span
            >
            <span v-if="ticket.type === 'OTHER'" class="chip Type other"
              >Other</span
            >
          </td>
          <td class="text-center">
            <template v-if="ticket.metadata">
              <span
                v-if="ticket.metadata.status === 'OPEN'"
                class="chip Status open"
                >Open</span
              >
              <span
                v-if="ticket.metadata.status === 'IN_PROGRESS'"
                class="chip Status inProgress"
                >In Progress</span
              >
              <span
                v-if="ticket.metadata.status === 'REJECTED'"
                class="chip Status rejected"
                >Rejected</span
              >
              <span
                v-if="ticket.metadata.status === 'RESOLVED'"
                class="chip Status resolved"
                >Resolved</span
              >
            </template>
          </td>
          <td>{{ ticket.id }}</td>
          <td><b>...</b></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div
    class="modal fade"
    id="newTicketModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="newTicketModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="newTicketModalLabel">
            File a New Ticket
          </h5>
        </div>
        <div class="modal-body">
          <div class="container">
            <div class="row g-5">
              <div class="col-md-6">
                <h6>Ticket Title:</h6>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Briefly describe the issue..."
                  v-model="newTicketTitle"
                />
              </div>
              <div class="col-md-6">
                <h6>Detailed Description:</h6>
                <textarea
                  class="form-control"
                  placeholder="Provide more details to describe the issue..."
                  v-model="newTicketDescription"
                ></textarea>
              </div>
            </div>
            <hr />
            <div class="row">
              <div class="col">
                <h6>Ticket Type</h6>
                <select class="form-select" v-model="newTicketType">
                  <option value="REQUEST_FOR_CHANGE">Request For Change</option>
                  <option value="INCIDENT">Incident</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div class="col">
                <h6>Ticket Priority</h6>
                <select class="form-select" v-model="newTicketPriority">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            data-bs-dismiss="modal"
          >
            Close
          </button>
          <button type="button" class="btn btn-primary" @click="addTicket">
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

thead th {
  background-color: #11af91;
  color: white;
}
</style>
