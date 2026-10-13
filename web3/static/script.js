let username = "";
let gameActive = false;

function startGame() {
    username = document.getElementById("username").value;
    if (!username.trim()) {
        document.getElementById("result").innerHTML = "❌ Введите никнейм";
        return;
    }

    const mode = document.getElementById("mode").value;

    fetch("/start", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: username,
            mode: mode
        })
    }).then(() => {
        gameActive = true;
        document.getElementById("result").innerHTML = "🎮 Игра началась! Введите число";
        document.getElementById("guess").value = "";
        document.getElementById("guess").disabled = false;
        document.getElementById("playAgainBtn").style.display = "none";
        document.getElementById("guess").focus();
        loadTop();
    });
}

function sendGuess() {
    if (!gameActive) {
        document.getElementById("result").innerHTML = "⚠️ Нажмите 'Играть снова'";
        return;
    }

    const number = document.getElementById("guess").value;

    if (!number) return;

    fetch("/guess", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: username,
            number: number
        })
    })
    .then(r => r.json())
    .then(data => {
        const out = document.getElementById("result");

        if (data.error) {
            out.innerHTML = "❌ " + data.error;
            gameActive = false;
            document.getElementById("guess").disabled = true;
            document.getElementById("playAgainBtn").style.display = "inline-block";
        } else if (data.result === "bigger") {
            out.innerHTML = "⬆️ БОЛЬШЕ ⬆️";
            document.getElementById("guess").value = "";
            document.getElementById("guess").focus();
        } else if (data.result === "smaller") {
            out.innerHTML = "⬇️ МЕНЬШЕ ⬇️";
            document.getElementById("guess").value = "";
            document.getElementById("guess").focus();
        } else if (data.result === "win") {
            out.innerHTML = "🎉 ПОБЕДА! " + data.rank + " | " + data.attempts + " попыток 🎉";
            gameActive = false;
            document.getElementById("guess").disabled = true;
            document.getElementById("playAgainBtn").style.display = "inline-block";
            loadTop();
            document.getElementById("guess").value = "";
        }
    });
}

function playAgain() {
    const mode = document.getElementById("mode").value;

    fetch("/start", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: username,
            mode: mode
        })
    }).then(() => {
        gameActive = true;
        document.getElementById("result").innerHTML = "🎮 Новая игра! Угадай число";
        document.getElementById("guess").value = "";
        document.getElementById("guess").disabled = false;
        document.getElementById("playAgainBtn").style.display = "none";
        document.getElementById("guess").focus();
        loadTop();
    });
}

function loadTop() {

    fetch("/top")
    .then(r => r.json())
    .then(data => {

        let html = "";

        data.forEach((r, i) => {

            const medal =
                i === 0 ? "🥇" :
                i === 1 ? "🥈" :
                i === 2 ? "🥉" :
                "📌";

            html += `

            <div class="top-record">

                ${medal}

                <input
                    id="name_${r.id}"
                    value="${r.username}"
                >

                <input
                    id="mode_${r.id}"
                    value="${r.mode}"
                >

                <input
                    id="attempts_${r.id}"
                    type="number"
                    value="${r.attempts}"
                    style="width:70px"
                >

                <button
                    onclick="saveRecord(${r.id})">
                    💾
                </button>

                <button
                    onclick="deleteRecord(${r.id})">
                    ❌
                </button>

            </div>

            `;
        });

        html += `
        <hr>

        <button onclick="clearDatabase()">
            🗑️ ОЧИСТИТЬ БД
        </button>
        `;

        document.getElementById("top").innerHTML =
            html;
    });
}

function saveRecord(id) {

    fetch("/admin/update/" + id, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            username:
                document.getElementById(
                    "name_" + id
                ).value,

            mode:
                document.getElementById(
                    "mode_" + id
                ).value,

            attempts:
                parseInt(
                    document.getElementById(
                        "attempts_" + id
                    ).value
                )
        })
    })
    .then(() => loadTop());
}


function deleteRecord(id) {

    fetch("/admin/delete/" + id, {

        method: "DELETE"

    })
    .then(() => loadTop());
}


function clearDatabase() {

    if (!confirm(
        "Удалить всю базу?"
    )) return;

    fetch("/admin/clear", {

        method: "DELETE"

    })
    .then(() => loadTop());
}

document.getElementById("username").addEventListener("change", startGame);
document.getElementById("mode").addEventListener("change", startGame);
document.getElementById("guess").addEventListener("keypress", function(e) {
    if (e.key === "Enter" && gameActive) {
        sendGuess();
    }
});
document.getElementById("playAgainBtn").addEventListener("click", playAgain);

loadTop();
