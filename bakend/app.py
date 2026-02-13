from flask import Flask, render_template, request, jsonify
import hashlib
import os
import json
from datetime import datetime
import html

app = Flask(__name__, template_folder='../templates', static_folder='../static')

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")


def hash_value(value):
    return hashlib.sha256(value.encode()).hexdigest()


def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r", encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading users: {e}")
        return {}


def save_users(users):
    try:
        with open(USERS_FILE, "w", encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving users: {e}")


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/auth', methods=['POST'])
def auth():
    data = request.json
    login = data.get("login")
    password = data.get("password")

    if not login or not password:
        return jsonify({"success": False, "error": "Введите логин и пароль"})

    users = load_users()
    hashed_login = hash_value(login)
    hashed_password = hash_value(password)

    # пользователь уже есть
    if hashed_login in users:
        user_data = users[hashed_login]
        
        if user_data["password"] == hashed_password:
            return jsonify({
                "success": True,
                "registered": True,
                "fio": user_data.get("fio", "")
            })
        else:
            return jsonify({
                "success": False,
                "error": "Неверный пароль"
            })

    # новый пользователь
    if len(login) < 3:
        return jsonify({"success": False, "error": "Логин должен содержать минимум 3 символа"})
    if len(password) < 4:
        return jsonify({"success": False, "error": "Пароль должен содержать минимум 4 символа"})

    return jsonify({
        "success": True,
        "registered": False
    })


# сохранение ФИО
@app.route('/save_fio', methods=['POST'])
def save_fio():
    data = request.json
    login = data.get("login")
    fio = data.get("fio")
    password = data.get("password")

    if not all([login, fio, password]):
        return jsonify({"success": False, "error": "Не все данные предоставлены"})

    # безопасная обработка ФИО
    fio = html.escape(fio.strip())
    
    users = load_users()
    hashed_login = hash_value(login)
    hashed_password = hash_value(password)

    # проверка, что пользователь еще не зарегистрирован
    if hashed_login in users:
        return jsonify({"success": False, "error": "Пользователь уже зарегистрирован"})

    # сохранение нового пользователя
    users[hashed_login] = {
        "password": hashed_password,
        "fio": fio,
        "created_at": datetime.now().isoformat()
    }

    save_users(users)
    return jsonify({"success": True})


@app.route('/check_auth', methods=['GET'])
def check_auth():
    """Проверка статуса авторизации (необязательно, можно использовать для проверки сессии)"""
    return jsonify({"authenticated": False})


if __name__ == '__main__':
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    
    print(f"Server starting...")
    print(f"Users file: {USERS_FILE}")
    print(f"Templates folder: {app.template_folder}")
    print(f"Static folder: {app.static_folder}")
    
    app.run(debug=True, port=5001, use_reloader=False) 