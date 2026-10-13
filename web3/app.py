from flask import Flask, request, jsonify, render_template
import sqlite3
import random

app = Flask(__name__)
DB = "game.db"

games = {}

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            mode TEXT NOT NULL,
            secret_number INTEGER NOT NULL,
            attempts INTEGER NOT NULL,
            result TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/start", methods=["POST"])
def start():
    data = request.json
    username = data["username"]
    mode = data["mode"]

    if mode == "easy":
        max_num = 10
    elif mode == "medium":
        max_num = 50
    else:
        max_num = 100

    secret = random.randint(1, max_num)

    games[username] = {
        "secret": secret,
        "attempts": 0,
        "mode": mode
    }

    return jsonify({"status": "ok"})

@app.route("/guess", methods=["POST"])
def guess():
    data = request.json
    username = data["username"]
    number = int(data["number"])

    if username not in games:
        return jsonify({"error": "no game"})

    game = games[username]
    game["attempts"] += 1

    secret = game["secret"]
    attempts = game["attempts"]

    if number < secret:
        return jsonify({"result": "bigger"})

    if number > secret:
        return jsonify({"result": "smaller"})

    if attempts == 1:
        rank = "Экстрасенс"
    elif attempts <= 5:
        rank = "Гений"
    elif attempts <= 10:
        rank = "Норм"
    else:
        rank = "Лошок"

    conn = get_db()
    conn.execute("""
        INSERT INTO results (username, mode, secret_number, attempts, result)
        VALUES (?, ?, ?, ?, ?)
    """, (username, game["mode"], secret, attempts, "win"))
    conn.commit()
    conn.close()

    del games[username]

    return jsonify({
        "result": "win",
        "attempts": attempts,
        "rank": rank
    })

@app.route("/top")
def top():
    conn = get_db()
    rows = conn.execute("""
        SELECT
            id,
            username,
            mode,
            attempts,
            created_at
        FROM results
        ORDER BY attempts ASC
        LIMIT 10
    """).fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows])

@app.route("/admin/all")
def admin_all():

    conn = get_db()

    rows = conn.execute("""
        SELECT *
        FROM results
        ORDER BY id DESC
    """).fetchall()

    conn.close()

    return jsonify([dict(row) for row in rows])


@app.route("/admin/update/<int:record_id>", methods=["PUT"])
def update_record(record_id):

    data = request.json

    conn = get_db()

    conn.execute("""
        UPDATE results
        SET username=?,
            mode=?,
            attempts=?
        WHERE id=?
    """, (
        data["username"],
        data["mode"],
        data["attempts"],
        record_id
    ))

    conn.commit()
    conn.close()

    return jsonify({"status": "updated"})


@app.route("/admin/delete/<int:record_id>", methods=["DELETE"])
def delete_record(record_id):

    conn = get_db()

    conn.execute(
        "DELETE FROM results WHERE id=?",
        (record_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({"status": "deleted"})


@app.route("/admin/clear", methods=["DELETE"])
def clear_database():

    conn = get_db()

    conn.execute("DELETE FROM results")

    conn.commit()
    conn.close()

    return jsonify({"status": "cleared"})

if __name__ == "__main__":
    app.run(port=5853)
