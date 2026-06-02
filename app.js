let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const DEADLINE = "11/06";

function addTask() {
    let task = {
        name: document.getElementById("name").value,
        role: document.getElementById("role").value,
        detail: document.getElementById("detail").value,
        slide: document.getElementById("slide").value,
        word: document.getElementById("word").value,
        speech: document.getElementById("speech").value,
        deadline: DEADLINE
    };

    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    render();
}

function render() {
    let list = document.getElementById("list");
    list.innerHTML = "";

    tasks.forEach((t, i) => {
        list.innerHTML += `
        <div class="task">
            <span class="delete" onclick="del(${i})">✖</span>

            <h3>${t.name} — ${t.role}</h3>

            <p>⏰ Deadline: ${t.deadline}</p>

            <p>📊 <b>Slide:</b> ${t.slide}</p>

            <p>📄 <b>Word Output:</b> ${t.word}</p>

            <p>🗣️ <b>Speech:</b> ${t.speech}</p>

            <p>📌 <b>Detail Task:</b><br>${t.detail}</p>
        </div>
        `;
    });
}

function del(i) {
    tasks.splice(i, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    render();
}

function exportData() {
    let dataStr = JSON.stringify(tasks, null, 2);
    let blob = new Blob([dataStr], {type:"application/json"});
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "bank_project_tasks.json";
    a.click();
}

render();
