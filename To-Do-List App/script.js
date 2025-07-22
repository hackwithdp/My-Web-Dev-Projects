
function addTask() {
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const taskText = taskInput.value.trim();

  if (taskText === "") return;

  const li = document.createElement("li");
  li.innerHTML = `${taskText} <button class="delete-btn" onclick="removeTask(this)">Remove</button>`;
  li.addEventListener("click", () => {
    li.classList.toggle("completed");
  });

  taskList.appendChild(li);
  taskInput.value = "";
}

function removeTask(button) {
  button.parentElement.remove();
}
