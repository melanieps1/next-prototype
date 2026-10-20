const screens = {
  today: document.querySelector("#today-screen"),
  project: document.querySelector("#project-screen"),
  task: document.querySelector("#task-screen"),
  integrations: document.querySelector("#integrations-screen"),
};

let lastScreen = "today";
let toastTimeout;
let currentSource = "email";
let currentTaskButton = null;
let currentTaskType = "detected";
const approvedTasks = new Set();
const emailSourceDialog = document.querySelector("#email-source-dialog");

function showToast(message, success = false) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.toggle("toast-success", success);
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

function showScreen(name) {
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.classList.toggle("active", screenName === name);
  });
  document.querySelectorAll("[data-screen]").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === name);
  });
  document.querySelector("#topbar-title").textContent = {
    today: "Today",
    project: "Q4 onboarding refresh",
    task: "Task details",
    integrations: "Integrations",
  }[name];
  if (name !== "task") {
    lastScreen = name;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openTask(origin = "today", taskType = "detected", taskButton = null) {
  lastScreen = origin;
  currentTaskType = taskType;
  currentTaskButton =
    taskButton ??
    document.querySelector(`#${origin}-screen [data-task="${taskType}"]`);
  const standalone = taskType === "standalone";
  currentSource = standalone ? "slack" : "meeting";
  document.querySelector("#task-heading").textContent = standalone
    ? "Book time with Sam about the partner feedback"
    : taskType === "project-task"
      ? "Review the customer interview themes"
      : "Share the onboarding risks with the team";
  document.querySelector("#task-subheading").textContent = standalone
    ? "A follow-up captured from Slack."
    : "A task captured from your product sync.";
  document.querySelector("#project-value").childNodes[0].textContent = standalone
    ? "No project "
    : "Q4 onboarding refresh ";
  document.querySelector("#date-value").childNodes[0].textContent = standalone ? "Tomorrow " : "Today ";
  document.querySelector(".source-avatar").textContent = standalone ? "#" : "P";
  document.querySelector(".transcript-source strong").textContent = standalone ? "Slack · #customer-feedback" : "Product sync";
  document.querySelector(".transcript-source small").textContent = standalone ? "Today, 9:18 AM · Message" : "Today, 10:14 AM · Meeting notes";
  document.querySelector(".context-card > p:not(.card-kicker)").textContent = standalone
    ? "I picked this up from Slack so you can stay with the conversation, not stop to write everything down."
    : "I picked this up from your meeting so you can stay with the conversation, not stop to write everything down.";
  document.querySelector(".detail-section blockquote").textContent = standalone
    ? "“Let’s find time this week to go through the partner feedback together.”"
    : "“I’ll share the top onboarding risks with the team after this. We should get ahead of the handoff gaps before the next customer cohort.”";
  document.querySelector("#task-notes").value = "";
  document.querySelector("#attachment-list").replaceChildren();
  document.querySelector("#review-task").hidden = approvedTasks.has(taskType);
  showScreen("task");
  document.querySelector("#task-screen .task-detail-main").classList.remove("task-editing");
}

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screen));
});

document.querySelector("#open-detected-task").addEventListener("click", () => openTask("today"));
document.querySelectorAll('[data-task="detected"], [data-task="project-task"], [data-task="standalone"]').forEach((button) => {
  button.addEventListener("click", () => {
    const origin = button.closest("#project-screen") ? "project" : "today";
    openTask(origin, button.dataset.task, button);
  });
});

document.querySelector("#task-back").addEventListener("click", () => showScreen(lastScreen));

document.querySelector("#review-task").addEventListener("click", () => {
  approvedTasks.add(currentTaskType);
  document.querySelector("#review-task").hidden = true;
  showToast("Reviewed. The task stays on your list. No extra steps needed.", true);
});

document.querySelector("#edit-task").addEventListener("click", () => {
  const title = document.querySelector("#task-heading");
  const detail = document.querySelector(".task-detail-main");
  const isEditing = detail.classList.toggle("task-editing");
  title.contentEditable = isEditing ? "true" : "false";
  if (isEditing) {
    title.focus();
    showToast("Edit the task title, then select Edit again to finish.");
  } else {
    showToast("Task updated.", true);
  }
  document.querySelector("#edit-task").textContent = isEditing ? "Save" : "Edit";
});

document.querySelector("#dismiss-task").addEventListener("click", () => {
  const taskRow = currentTaskButton?.closest(".task-row, .project-task-row");
  taskRow?.remove();
  showToast("Task removed from your list.", true);
  window.setTimeout(() => showScreen(lastScreen), 650);
});

document.querySelectorAll(".task-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const isComplete = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isComplete));
    button.setAttribute(
      "aria-label",
      `${isComplete ? "Mark" : "Reopen"} ${button.nextElementSibling.querySelector("strong").textContent} ${isComplete ? "as done" : "task"}`,
    );
    button.closest(".task-row").classList.toggle("task-completed", !isComplete);
    showToast(isComplete ? "Task moved back to your list." : "Task marked as done.", true);
  });
});

document.querySelector("#complete-focus").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.innerHTML = 'Done <span aria-hidden="true">✓</span>';
  button.disabled = true;
  document.querySelector(".focus-card").classList.add("focus-completed");
  showToast("Nice work. Your next focus is ready when you are.", true);
});

function showEmailSource(source = currentSource) {
  const preview = {
    email: {
      kicker: "EMAIL · ALEX MORGAN",
      heading: "Revised launch brief",
      meta: "Today, 9:42 AM · To you",
      body: "Could you send the revised launch brief before the team review? That’s the last thing we need to unblock feedback.",
      signoff: "From Alex",
    },
    slack: {
      kicker: "SLACK · #CUSTOMER-FEEDBACK",
      heading: "Partner feedback",
      meta: "Today, 9:18 AM · Sam Rivera",
      body: "Let’s find time this week to go through the partner feedback together.",
      signoff: "From Sam",
    },
    meeting: {
      kicker: "MEETING NOTES · PRODUCT SYNC",
      heading: "Onboarding risks",
      meta: "Today, 10:14 AM · Product sync",
      body: "I’ll share the top onboarding risks with the team after this. We should get ahead of the handoff gaps before the next customer cohort.",
      signoff: "Product sync transcript",
    },
  }[source];
  document.querySelector("#source-preview-kicker").textContent = preview.kicker;
  document.querySelector("#source-preview-heading").textContent = preview.heading;
  document.querySelector("#source-preview-meta").textContent = preview.meta;
  document.querySelector("#source-preview-body").textContent = preview.body;
  document.querySelector("#source-preview-signoff").textContent = preview.signoff;
  emailSourceDialog.showModal();
}

document.querySelector(".source-open").addEventListener("click", () => showEmailSource());
document.querySelector("#integration-status").addEventListener("click", () => showScreen("integrations"));

document.querySelector("#notification-button").addEventListener("click", () => openTask("today"));

document.querySelector("#show-all").addEventListener("click", () => {
  document.querySelector("#task-list").scrollIntoView({ behavior: "smooth", block: "center" });
  showToast("Your tasks are all here. Nothing else to manage.");
});

document.querySelector("#add-task").addEventListener("click", () => {
  showToast("A new project task can be added here in the full product.");
});

document.querySelectorAll(".attribute-value").forEach((button) => {
  button.addEventListener("click", () => {
    const choices = {
      "date-value": ["Today", "Tomorrow", "Friday"],
      "project-value": ["Q4 onboarding refresh", "No project"],
      "reminder-value": ["None", "Tomorrow morning", "In 1 hour"],
    };
    const options = choices[button.id];
    const current = button.childNodes[0].textContent.trim();
    const next = options[(options.indexOf(current) + 1) % options.length];
    button.childNodes[0].textContent = next + " ";
    const label = button.closest(".attribute-row").querySelector(".attribute-label > span, :scope > span").textContent;
    showToast(`${label} set to ${next}.`, true);
  });
});

document.querySelector("#task-notes").addEventListener("change", () => {
  showToast("Task details saved.", true);
});

document.querySelector("#task-attachments").addEventListener("change", (event) => {
  const list = document.querySelector("#attachment-list");
  for (const file of event.currentTarget.files) {
    const item = document.createElement("li");
    item.textContent = file.name;
    list.append(item);
  }
  if (event.currentTarget.files.length) {
    showToast(`${event.currentTarget.files.length} file${event.currentTarget.files.length === 1 ? "" : "s"} attached.`, true);
  }
  event.currentTarget.value = "";
});

document.querySelectorAll('[data-task="completed"]').forEach((button) => {
  button.addEventListener("click", () => showToast("Already completed. Nice work.", true));
});

document.querySelectorAll('[data-task="later"]').forEach((button) => {
  button.addEventListener("click", () => showToast("This task is safely tracked for later."));
});
