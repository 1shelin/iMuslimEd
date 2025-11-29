from flask import Flask, render_template, request, jsonify
import hashlib
import os
import json
from datetime import datetime

app = Flask(__name__, template_folder='../templates', static_folder='../static')

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def hash_value(value):
    return hashlib.sha256(value.encode()).hexdigest()

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}

def save_user(login, password):
    users = load_users()
    hashed_login = hash_value(login)
    
    users[hashed_login] = {
        "password": hash_value(password),
        "created_at": datetime.now().isoformat()
    }
    
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def check_user(login, password):
    users = load_users()
    hashed_login = hash_value(login)
    hashed_password = hash_value(password)
    
    user = users.get(hashed_login)
    if user and user["password"] == hashed_password:
        return True
    return False

def is_user_exists(login):
    users = load_users()
    hashed_login = hash_value(login)
    return hashed_login in users

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/auth', methods=['POST'])
def auth():
    data = request.json
    login = data.get("login")
    password = data.get("password")

    if not login or not password:
        return jsonify({"success": False, "error": "Логин и пароль обязательны"})

    user_exists = is_user_exists(login)
    
    if user_exists:
        if check_user(login, password):
            return jsonify({"success": True, "new": False})
        else:
            return jsonify({"success": False, "error": "Неверный логин или пароль"})
    else:
       
        save_user(login, password)
        return jsonify({"success": True, "new": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)