document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Small utility to escape HTML when injecting participant names/emails
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (rows with delete icon) or a friendly empty-state
        const participants = Array.isArray(details.participants)
          ? details.participants
          : [];

        let participantsHTML = "";
        if (participants.length > 0) {
          participantsHTML = `
            <div class="participants">
              <h5 class="participants-title">Participants</h5>
              <div class="participants-list">
                ${participants
                  .map((p) => `
                    <div class="participant-row">
                      <span class="participant-name">${escapeHtml(p)}</span>
                      <button class="delete-participant" title="Remove participant" data-activity="${escapeHtml(name)}" data-participant="${escapeHtml(p)}">
                        &#128465;
                      </button>
                    </div>
                  `)
                  .join("")}
              </div>
            </div>
          `;
        } else {
          participantsHTML = `
            <p class="no-participants">No participants yet — be the first to sign up!</p>
          `;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p class="activity-description">${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        // Add event listeners for delete buttons after card is added to DOM
        setTimeout(() => {
          const deleteButtons = activityCard.querySelectorAll('.delete-participant');
          deleteButtons.forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              e.preventDefault();
              const activityName = btn.getAttribute('data-activity');
              const participant = btn.getAttribute('data-participant');
              btn.disabled = true;
              btn.innerHTML = '...';
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(participant)}`,
                  { method: 'POST' }
                );
                if (response.ok) {
                  // Refresh activities list to update UI
                  fetchActivities();
                } else {
                  btn.innerHTML = '&#128465;';
                  btn.disabled = false;
                  alert('Failed to remove participant.');
                }
              } catch (error) {
                btn.innerHTML = '&#128465;';
                btn.disabled = false;
                alert('Error removing participant.');
              }
            });
          });
        }, 0);

        activitiesList.appendChild(activityCard);

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
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
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
