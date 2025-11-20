from flask import Flask, render_template, request, jsonify
import hashlib
import os
import json

app = Flask(__name__, template_folder='../templates', static_folder='../static')

USERS_FILE = "users.json"

def hash_value(value):
    return hashlib.sha256(value.encode()).hexdigest()

def load_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_user(login, password):
    users = load_users()
    users.append({
        "login": hash_value(login),
        "password": hash_value(password),
    })
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def check_user(login, password):
    hashed_login = hash_value(login)
    hashed_password = hash_value(password)
    return any(u["login"] == hashed_login and u["password"] == hashed_password for u in load_users())

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/auth', methods=['POST'])
def auth():
    data = request.json
    login = data.get("login")
    password = data.get("password")

    if check_user(login, password):
        return jsonify({"success": True})
    else:
        save_user(login, password)
        return jsonify({"success": True, "new": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
