<script>
import { useNotification } from '@/useNotification';

export default {
  props: ['ticket', 'session'],

  data() {
    return {
      comments: [],
      newCommentText: '',
      isCommentPublic: true,
      isCommentInternal: false,
      consultants: [],
      rejectionReason: '',
      ticketUpdate: {
        assignedToId: -1,
        priority: '',
        type: ''
      }
    }
  },

  setup() {
    const {showNotification} = useNotification();
    return {showNotification};
  },

  async created() {
    await this.fetchComments();
    if(this.session && this.session.role === 'support') {
      await this.getConsultants();
    }

    this.ticketUpdate.assignedToId = this.ticket.metadata.assignedTo?.id;
    this.ticketUpdate.priority = this.ticket.priority;
    this.ticketUpdate.type = this.ticket.type;
  },

  methods: {
    async fetchComments() {
      try {
        const response = await fetch(`/api/comments/my-comments/${this.ticket.id}`, {
          method: "GET",
          headers: {
            "token": this.session.token
          }
        });
        if(response.ok) {
          this.comments = await response.json();
          this.comments.forEach(comment => {
            comment.creationDate = new Date(comment.creationDate).toLocaleString();
          });
        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("Failed to load comments from server", "danger");
        }
      }
      catch(error) {
        this.showNotification("Failed to get comments", "danger");
      }
    },

    async submitComment() {
      if(this.newCommentText.trim() === '') {
        this.showNotification("Please fill in the comment field", "warning");
        return;
      }

      const payload = {
        content: this.newCommentText,
        isPublic: !this.isCommentInternal
      };
      try {
        const response = await fetch(`/api/comments/post/${this.ticket.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "token": this.session.token
          },
          body: JSON.stringify(payload)
        });

        if(response.ok) {
          const freshComment = await response.json();
          freshComment.creationDate = new Date(freshComment.creationDate).toLocaleString();
          this.comments.push(freshComment);
          this.newCommentText = '';
          this.isCommentInternal = false;
          this.showNotification("Comment added!", "success");
        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("Failed to create comment", "danger");
        }
      }
      catch(error) {
        this.showNotification("Network error has occurred", "danger")
      }
    },

    async updateAssignment(ticket) {
      const selectedUsername = ticket.metadata.assignedTo.username;

      if(!selectedUsername) {
        this.showNotification("Unassigning is not yet available", "warning");
        return;
      }

      const targetConsultant = this.consultants.find(c => c.username === selectedUsername);

      if(!targetConsultant || !targetConsultant.id) {
        this.showNotification("Could not locate a numeric account ID for this consultant.", "danger");
        return;
      }

      this.ticketUpdate.assignedToId = targetConsultant.id;

      /*try {
        const response = await fetch(`/api/tickets/assign/${ticket.id}/${targetConsultant.id}`, {
          method: "PUT",
          headers: {
                    "Content-Type": "application/json",
                    "token" : this.session.token
                },
        });

        if (response.ok) {
          this.showNotification(`Ticket successfully assigned to ${selectedUsername}!`, "success");
        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("The backend rejected this assignment update.", "danger");
        }
      } catch (error) {
        console.error("Assignment network error:", error);
        this.showNotification("Network error: Failed to modify ticket assignment.", "danger");
      }*/
    },

    async getConsultants() {
      try {
        const response = await fetch('/api/accounts/consultants', {
          method: "GET",
          headers: {
            "token": this.session.token
          }
        });
        if(response.ok) {
          this.consultants = await response.json();
        }
        else if(response.status === 401) this.$emit('logout');

      }
      catch(error) {
        console.error(error);
        this.showNotification("Failed to get consultants!", "danger");
      }
    },
    async resolveTicket(ticketId) {
      try {
        const response = await fetch(`/api/tickets/resolve/${ticketId}`, {
          method: "PUT",
          headers: {
            "token": this.session.token
          }
        })

        if(response.ok) {
          this.ticket.metadata.status = 'Resolved';
          this.showNotification("Ticket has been resolved!", "success");
        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("Backend rejected resolving this ticket", "danger");
        }
      }
      catch(error) {
        console.error("Error resolving ticket:", error);
        this.showNotification("Network error trying to resolve ticket.", "danger");
      }
    },

    async rejectTicket(ticketId) {
      if(this.rejectionReason.trim() === '') {
        this.showNotification("Please provide a reason for rejecting this ticket.", "warning");
        return;
      }
      this.newCommentText = this.rejectionReason;
      this.isCommentPublic = true;

      await this.submitComment();
      try {
        const response = await fetch(`/api/tickets/reject/${ticketId}`, {
          method: "PUT",
          headers: {
            "token": this.session.token
          }
        });

        if(response.ok) {
          this.ticket.metadata.status = 'Rejected';
          this.showNotification("Ticket rejected successfully.", "success");
          this.rejectionReason = '';
        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("Comment saved, but backend rejected the rejection status update.", "danger");
        }
      }
      catch(error) {
        console.error(error);
        this.showNotification("Network error occurred during rejection.", "danger");
      }

    },

    hasUnsavedChanges() {
      let changedAssignedTo;
      if(this.ticket.metadata.assignedTo == null) {
        changedAssignedTo = false;
      }
      else {
        changedAssignedTo = this.ticket.metadata.assignedTo.id !== this.ticketUpdate.assignedToId;
      }
      return changedAssignedTo ||
          this.ticket.type !== this.ticketUpdate.type ||
          this.ticket.priority !== this.ticketUpdate.priority
    },
    async applyChanges() {
      try {
        const response = await fetch(`/api/tickets/update/${this.ticket.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "token": this.session.token
          },
          body: JSON.stringify(this.ticketUpdate)
        })

        if(response.ok) {
          this.showNotification("Changes applied.", "success");
          this.ticket.type = this.ticketUpdate.type;
          this.ticket.priority = this.ticketUpdate.priority;
          this.ticket.metadata.assignedTo.id = this.ticketUpdate.assignedToId;
        }
        else if(response.status === 401) this.$emit('logout');
        else {
          this.showNotification("Changes failed to apply.", "danger");
        }
      }
      catch(error) {
        this.showNotification("Network error occurred during rejection.", "danger");
      }
    }
  }

}

</script>

<template>


  <div class=" sticky-top d-flex" style="background-color: #11AF91; padding: 3px; padding-right: 20px;">

    <div class="col-7 d-flex justify-content-end align-items-center">
      <button class="btn" @click="$emit('back')"><img
          src="/icons/return.png" alt="Back to all ticket view" style="height: 30px;"></button>
    </div>

    <div class="col d-flex justify-content-center align-items-center d-grid gap-3 whiteFrame">
      <span v-if="ticket.priority === 'LOW'"><img src="/icons/priority/low.png" style="width:25px;" alt="Low">Low</span>
      <span v-if="ticket.priority === 'MEDIUM'"><img src="/icons/priority/medium.png" style="width:25px;"
                                                     alt="Medium">Medium</span>
      <span v-if="ticket.priority === 'HIGH'"><img src="/icons/priority/high.png" style="width:25px; "
                                                   alt="High">High</span>
      <span v-if="ticket.priority === 'CRITICAL'"><img src="/icons/priority/critical.png" style="width:25px; "
                                                       alt="Critical">Critical</span>


      <span v-if="ticket.metadata.status === 'OPEN'" class="chip Status open">Open</span>
      <span v-if="ticket.metadata.status === 'IN_PROGRESS'" class="chip Status inProgress">In Progress</span>
      <span v-if="ticket.metadata.status === 'REJECTED'" class="chip Status rejected">Rejected</span>
      <span v-if="ticket.metadata.status === 'RESOLVED'" class="chip Status resolved">Resolved</span>


      <span v-if="ticket.type === 'INCIDENT'" class="chip Type incident">Incident</span>
      <span v-if="ticket.type === 'OTHER'" class="chip Type other">Other</span>
      <span v-if="ticket.type === 'REQUEST_FOR_CHANGE'" class="chip Type RFC">RFC </span>


      <i style="color: gray;">ID:{{ ticket.id }}</i>


    </div>
  </div>

  <div class="container m-1">


    <div class="row mt-2">

      <h1 style="margin: 10px;">{{ ticket.title }}</h1>
    </div>


    <div class="row">
      <div class="col-8">
        <div class="container p-2 whiteFrame mb-3">
          <div class="row">
            <div class="col-6 d-flex align-items-center">
              <strong class="me-1">Customer:</strong> {{ ticket.creatorUsername }}
            </div>

            <div class="col-6 d-flex justify-content-end align-items-center">
              <div class="whiteFrame da">
                <b>Assigned Consultant:</b> {{ ticket.metadata.assignedTo?.username }}
              </div>
            </div>
          </div>
        </div>

        <p style="white-space: pre-wrap;">{{ ticket.description }}</p>
      </div>


      <!--stupid square to the right of desc.-->
      <div v-if="session.role === 'support' || session.role === 'consultant'" class="col-4">

        <div class="basicFrame">
          <div class="row">
            <div v-if="session.role === 'support'" class="col-5  "><strong>Assigned To:</strong>
              <br><br>
              <strong strong class="me-1">Change Ticket Priority:</strong>
              <br><br>
              <strong strong class="me-1">Change Ticket Type:</strong>
            </div>

            <div class="col p-0 ">
              <div v-if="session.role === 'support'">
                <div class="">
                  <select class="btn btn-secondary " v-model="ticketUpdate.assignedToId">
                    <option value="" disabled selected hidden>--Unassigned--</option>
                    <option v-for="consultant in consultants" :key="consultant.username" :value="consultant.id">
                      {{ consultant.username }}
                    </option>
                  </select>
                </div>
              </div>


              <div class="mt-3 mb-3">

                <div v-if="session.role === 'support'" class="mb-2">

                  <select class="btn btn-secondary" v-model="ticketUpdate.priority">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>

                </div>
              </div>

              <div class="mt-3 mb-3">

                <div v-if="session.role === 'support'" class="mb-2">

                  <select class="btn btn-secondary" v-model="ticketUpdate.type">
                    <option value="INCIDENT">Incident</option>
                    <option value="REQUEST_FOR_CHANGE">RFC</option>
                    <option value="OTHER">Other</option>
                  </select>

                </div>
              </div>

            </div>


            <div class="row mt-2">
              <div class="col d-flex">
                <button class="btn btn-primary" v-if="session.role === 'support' || session.role === 'consultant'"
                        type="button" @click="resolveTicket(ticket.id)">
                  Resolve Ticket
                </button>
              </div>
              <div class="col d-flex">
                <div v-if="session.role === 'support'">
                  <button type="button" class="btn btn-danger " data-bs-toggle="modal"
                          data-bs-target="#rejectTicketModal">
                    Reject Ticket
                  </button>
                </div>
              </div>
              <div class="col d-flex">
                <div v-if="session.role === 'support' && hasUnsavedChanges()" @click="applyChanges()">
                  <button type="button" class="btn btn-warning">
                    Apply changes
                  </button>
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <hr>

    <h3>Comments</h3>

    <div v-if="comments.length === 0">
      <p>No comments yet on this ticket.</p>
    </div>
    <ul v-else>
      <li v-for="comment in comments" :key="comment.id">

        <div v-if="comment.isPublic">
          <div class="basicFrame">
            <div class="container, basicFrame">
              <div class="row">
                <div class="col d-flex align-items-center">
                  <b>{{ comment.commenterName || 'User' }}</b>
                </div>

                <div class="col-3 d-flex  justify-content-end align-items-center">{{ comment.creationDate }}</div>
                <div class="col-2 d-flex align-items-center">
                  <div class="chipGeneric">
                    <span v-if="comment.isPublic">Public</span>
                    <span v-if="!comment.isPublic">Internal</span>
                  </div>
                </div>
              </div>
            </div>
            <div class=""> {{ comment.content }}</div>
          </div>
        </div>
        <div v-if="!comment.isPublic">
          <div class="basicFrame dashed">
            <div class="container, basicFrame">
              <div class="row">
                <div class="col d-flex align-items-center">
                  <b>{{ comment.commenterName || 'User' }}</b>
                </div>

                <div class="col-3 d-flex  justify-content-end align-items-center">{{ comment.creationDate }}</div>
                <div class="col-2 d-flex align-items-center">
                  <div class="chipGeneric" style="border: dashed 1.5px gray;">
                    <span v-if="comment.isPublic">Public</span>
                    <span v-if="!comment.isPublic">Internal</span>
                  </div>
                </div>
              </div>
            </div>
            <div class=""> {{ comment.content }}</div>
          </div>
        </div>


      </li>
    </ul>

    <br/>

    <div v-if="ticket.metadata.status !== 'Resolved' && ticket.metadata.status !== 'Rejected'">
      <form @submit.prevent="submitComment">
        <label for="comment-box">Add a comment:</label><br/>
        <textarea class="form-control" id="comment-box" rows="3" placeholder="Type your reply here..."
                  v-model="newCommentText"></textarea>
        <div class="row d-flex justify-content-center align-items-center mt-2 mb-3">
          <div class="col-2">
            <button class="btn btn-primary" type="submit">Submit Comment</button>
          </div>


          <div class="col">
            <div v-if="session && (session.role === 'support' || session.role === 'consultant')"
                 class="switch-container">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault"
                       v-model="isCommentInternal" :true-value="false" :false-value="true">
                <label class="form-check-label" for="flexSwitchCheckDefault">Public</label>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  </div>


  <!--popup start-->
  <div class="modal fade" id="rejectTicketModal" tabindex="-1" role="dialog" aria-labelledby="rejectTicketModal"
       aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="rejectTicketModal">Reject Ticket</h5>

        </div>
        <div class="modal-body">
          <div v-if="session.role === 'support'">
            <label for="reject-reason-input">Reason for rejection:</label><br/>
            <textarea class="form-control" id="reject-reason-input" rows="3" v-model="rejectionReason"></textarea>
            <br/>

          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>

          <button type="button" class="btn btn-danger" @click="rejectTicket(ticket.id)">
            Reject Ticket
          </button>
        </div>
      </div>
    </div>
  </div>


</template>
<style scoped>
ul {
  list-style: none;
  padding-left: 0;
  border-left: 2px solid #EF692A;
  margin-left: 20px;
}

ul li {
  position: relative;
  padding-left: 15px;
  margin-bottom: 10px;
}

ul li::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 25px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #EF692A;
}
</style>
