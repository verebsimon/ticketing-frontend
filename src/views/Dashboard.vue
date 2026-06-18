<script>
import { useNotification } from '@/useNotification';

export default {

  props: ['session'],

  data() {
    return {
      tickets: [],
      consultants: [],

      newUsername: '',
      newRole: 'customer',
      newPassword: '',
      newEmail: '',

      newTicketTitle: '',
      newTicketDescription: '',
      newTicketPriority: 'LOW',
      newTicketType: 'INCIDENT',

      sortingField: '',
      sortingAscending: '',

      PRIORITY_ORDER: {
        'Critical': 0,
        'High': 1,
        'Medium': 2,
        'Low': 3
      },

      TYPE_ORDER: {
        'Request For Change': 0,
        'Other': 1,
        'Incident': 2
      },

      STATUS_ORDER: {
        'Open': 0,
        'In Progress': 1,
        'Resolved': 2,
        'Rejected': 3
      }
    }
  },

  setup() {
    const {showNotification} = useNotification();
    return {showNotification};
  },


  async created() {
    await this.getTickets();
  },

  methods: {
    countStatus(status) {
      return this.tickets.filter(ticket => ticket.metadata.status === status).length;
    },

    countType(type) {
      return this.tickets.filter(ticket => ticket.type === type).length;
    },

    goToTicket(ticket) {
      this.$emit('select-ticket', ticket);
    },

    async getTickets() {
      try {
        const response = await fetch('/api/tickets/my-tickets', {
          method: "GET",
          headers: {
            "token": this.session.token
          }
        });

        if(response.ok) {
          const rawTickets = await response.json();

          const formatText = (str) => {
            if(!str) return '';
            return str
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase());
          };

          this.tickets = rawTickets.map(ticket => {
            ticket.priority = formatText(ticket.priority);
            ticket.type = formatText(ticket.type);
            ticket.metadata.status = formatText(ticket.metadata.status);
            return ticket;
          });
        }else if(response.status === 401) this.$emit('logout');

      }
      catch(error) {
        console.error(error);
        this.showNotification("Failed to get tickets", "danger");
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
        permissionLevel: this.newRole
      };

      const response = await fetch('api/accounts', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": this.session.token
        },
        body: JSON.stringify(userCreated)
      })

      if(response.ok) {
        this.showNotification("Account created successfully!", "success");
      }
      else if(response.status === 401) this.$emit('logout');
      else {
        this.showNotification("Failed to create account.", "danger");
      }

      this.newUsername = '';
      this.newPassword = '';
      this.newEmail = '';
    },

    async addTicket() {
      if(this.newTicketTitle === '' || this.newTicketDescription === '') {
        this.showNotification("Please complete both the title and description fields", "warning");
        return;
      }

      const freshTicket = {
        title: this.newTicketTitle,
        description: this.newTicketDescription,
        type: this.newTicketType,
        priority: this.newTicketPriority

      };

      const response = await fetch('/api/tickets', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": this.session.token
        },
        body: JSON.stringify(freshTicket)
      })

      if(response.ok) {
        this.showNotification("Ticket submitted successfully!", "success");
        const formatText = (str) => {
          if(!str) return '';
          return str
              .toLowerCase()
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (char) => char.toUpperCase());
        };

        const submitted = await response.json();

        submitted.priority = formatText(submitted.priority);
        submitted.type = formatText(submitted.type);
        submitted.metadata.status = formatText(submitted.metadata.status);

        this.tickets.push(submitted);
      }
      else if(response.status === 401) this.$emit('logout');
      else {
        this.showNotification("Failed to submit ticket", "danger");
      }

      this.newTicketTitle = '';
      this.newTicketDescription = '';
      this.newTicketPriority = 'LOW';
      this.newTicketType = 'INCIDENT';

    },

    sortTickets(field) {
      if(this.sortingField === field) {
        this.sortingAscending = !this.sortingAscending;
      }
      else {
        this.sortingAscending = true;
      }

      this.sortingField = field;

      this.tickets.sort((a, b) => {
        let sort = 0;
        switch(field) {
          case 'creator':
            sort = a.creatorUsername.localeCompare(b.creatorUsername)
            break
          case 'priority':
            sort = this.PRIORITY_ORDER[a.priority] - this.PRIORITY_ORDER[b.priority]
            break
          case 'type':
            sort = this.TYPE_ORDER[a.type] - this.TYPE_ORDER[b.type]
            break
          case 'status':
            sort = this.STATUS_ORDER[a.metadata.status] - this.STATUS_ORDER[b.metadata.status]
            break
        }
        return this.sortingAscending ? sort : -sort
      })
    }
  }
}
</script>

<template>


  <div class="container p-0">
    <table class="table table-hover align-middle border">
      <thead>
      <tr>
        <th scope="col">Title</th>

        <th class="sorting-field" scope="col" @click="sortTickets('creator')">Customer
          <span v-if="sortingField === 'creator'">
            <span v-if="sortingAscending"> ^</span>
            <span v-if="!sortingAscending"> ⌄</span>
          </span></th>
        <th class="sorting-field " scope="col" @click="sortTickets('priority')">Priority
          <span v-if="sortingField === 'priority'">
            <span v-if="sortingAscending"> ^</span>
            <span v-if="!sortingAscending"> ⌄</span>
          </span>
        </th>

        <th class="sorting-field text-center" scope="col" @click="sortTickets('type')">Type
          <span v-if="sortingField === 'type'">
            <span v-if="sortingAscending"> ^</span>
            <span v-if="!sortingAscending"> ⌄</span>
          </span>
        </th>
        <th class="sorting-field text-center" scope="col" @click="sortTickets('status')">Status
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
          v-for="ticket in tickets"
          :key="ticket.id"
          @click="goToTicket(ticket)"
          style="cursor: pointer;"
      >
        <td><b class="ticket-title">{{ ticket.title }}</b></td>

        <td>{{ ticket.creatorUsername }}</td>
        <td>
          <span v-if="ticket.priority==='Low'"><img src="/icons/priority/low.png" style="width:25px;"
                                                    alt="Low">{{ ticket.priority }}</span>
          <span v-if="ticket.priority==='Medium'"><img src="/icons/priority/medium.png" style="width:25px;"
                                                       alt="Medium">{{ ticket.priority }}</span>
          <span v-if="ticket.priority==='High'"><img src="/icons/priority/high.png" style="width:25px; "
                                                     alt="High">{{ ticket.priority }}</span>
          <span v-if="ticket.priority==='Critical'"><img src="/icons/priority/critical.png" style="width:25px; "
                                                         alt="Critical">{{ ticket.priority }}</span>
        </td>


        <td class="text-center">
          <span v-if="ticket.type==='Incident'" class="chip Type incident">{{ ticket.type }}</span>
          <span v-if="ticket.type==='Request For Change'" class="chip Type RFC">RFC </span>
          <span v-if="ticket.type==='Other'" class="chip Type other">{{ ticket.type }}</span>

        </td>

        <td class="text-center"><span v-if="ticket.metadata.status==='Open'"
                                      class="chip Status open">{{ ticket.metadata.status }}</span>
          <span v-if="ticket.metadata.status==='In Progress'" class="chip Status inProgress">{{
              ticket.metadata.status
            }}</span>
          <span v-if="ticket.metadata.status==='Rejected'" class="chip Status rejected">{{
              ticket.metadata.status
            }}</span>
          <span v-if="ticket.metadata.status==='Resolved'" class="chip Status resolved">{{
              ticket.metadata.status
            }}</span>

        </td>
        <td>{{ ticket.id }}</td>


        <td><b>...</b></td>
      </tr>
      </tbody>
    </table>
  </div>


  <!--popups start-->
  <!-- Modal for new ticket -->
  <div class="modal fade" id="newTicketModal" tabindex="-1" role="dialog" aria-labelledby="newTicketModalLabel"
       aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="newTicketModalLabel">File a New Ticket</h5>

        </div>
        <div class="modal-body">
          <div class="container">
            <div class="row g-5">

              <div class="col-md-6">
                <h6>Ticket Title: </h6>
                <input type="text" class="form-control" placeholder="Briefly describe the issue..."
                       v-model="newTicketTitle">


              </div>


              <div class="col-md-6">
                <h6>Detailed Description: </h6>
                <textarea type="text" class="form-control" placeholder="Provide more details to describe the issue..."
                          v-model="newTicketDescription"></textarea>


              </div>


              <br>
            </div>
            <hr>
            <div class="row">
              <div class="col"><h6>Ticket Type</h6>
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
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" @click="addTicket">Submit Ticket</button>

        </div>
      </div>
    </div>
  </div>

  <!--popup end-->
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
  background-color: #11AF91;
  color: white;
}

</style>
