document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants ? details.participants.length : 0);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            <strong>Participants:</strong>
            <ul class="participants-list"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants safely
        const participantsList = activityCard.querySelector(".participants-list");
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = p;

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "participant-delete";
            delBtn.title = `Unregister ${p}`;
            delBtn.textContent = "×";

            // Delete handler
            delBtn.addEventListener("click", async () => {
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );
                const data = await res.json();
                if (res.ok) {
                  messageDiv.textContent = data.message;
                  messageDiv.className = "message success";
                  messageDiv.classList.remove("hidden");
                  // Refresh activities to reflect change
                  await fetchActivities();
                } else {
                  messageDiv.textContent = data.detail || "Failed to remove participant";
                  messageDiv.className = "message error";
                  messageDiv.classList.remove("hidden");
                }
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 5000);
              } catch (error) {
                console.error("Error removing participant:", error);
                messageDiv.textContent = "Failed to remove participant. Please try again.";
                messageDiv.className = "message error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 5000);
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            participantsList.appendChild(li);
          });
        } else {
          const empty = document.createElement("p");
          empty.className = "participants-empty";
          empty.textContent = "No participants yet";
          participantsList.parentNode.replaceChild(empty, participantsList);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities list to reflect new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
