from flask import Flask, render_template, request, jsonify
import hashlib
import os
import json
import re
from datetime import datetime
import html
import requests

app = Flask(__name__, template_folder='../templates', static_folder='../static')

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
KIE_API_URL = "https://api.kie.ai/gemini-3-flash/v1/chat/completions"

SYSTEM_PROMPT = (
    "Ты ассистент IMuslimEd. Отвечай по-русски, нейтрально, кратко и структурированно. "
    "Темы: исламские традиции, 4 суннитских мазхаба, студенческая адаптация, халяль-инфраструктура, "
    "межкультурное взаимодействие, функции сервиса. "
    "Если есть разногласия между мазхабами, перечисли позиции: ханафитский, маликитский, шафиитский, ханбалитский. "
    "Не выноси личные фетвы и не давай мед/юр/фин консультации. "
    "Если вопрос вне компетенции, напиши: "
    "«Данный вопрос требует консультации с квалифицированным специалистом или религиозным наставником. "
    "Сервис IMuslimEd предоставляет справочную информацию общего характера.» "
    "Формат обязателен: только обычный текст, без Markdown, без решеток, без таблиц, без символа |, без списков. "
    "Не упоминай название модели, провайдера, слово нейросеть или ИИ. "
    "Не задавай встречных вопросов в конце ответа. Пиши: Мухаммад (не Мухаммед). "
    "Ограничение: 3-6 коротких предложений."
)


def load_env_file():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    env_path = os.path.abspath(env_path)
    if not os.path.exists(env_path):
        return

    try:
        with open(env_path, "r", encoding="utf-8") as env_file:
            for raw in env_file:
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value
    except Exception as e:
        print(f"Error loading .env: {e}")


load_env_file()

MAX_USER_CHARS = int(os.environ.get("MAX_USER_CHARS", "250"))
MAX_OUTPUT_TOKENS = int(os.environ.get("MAX_OUTPUT_TOKENS", "70"))
KIE_TEMPERATURE = float(os.environ.get("KIE_TEMPERATURE", "0.2"))


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


def get_kie_api_key():
    return (os.environ.get("KIE_API_KEY") or "").strip()


def ask_kie_gemini(user_message):
    api_key = get_kie_api_key()
    if not api_key:
        return "KIE API ключ не найден. Установите переменную окружения KIE_API_KEY."

    payload = {
        "max_tokens": MAX_OUTPUT_TOKENS,
        "temperature": KIE_TEMPERATURE,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_message,
            },
        ],
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            KIE_API_URL,
            headers=headers,
            json=payload,
            timeout=60,
        )
    except requests.RequestException:
        return "Не удалось подключиться к KIE API. Проверьте интернет и повторите запрос."

    if response.status_code != 200:
        return f"KIE API ошибка: HTTP {response.status_code}. Проверьте ключ и баланс."

    try:
        data = response.json()
    except ValueError:
        return "KIE API вернул некорректный ответ."

    choices = data.get("choices") or []
    if not choices:
        return "Пустой ответ от модели."

    message = choices[0].get("message", {})
    content = message.get("content", "")

    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text":
                text_parts.append(part.get("text", ""))
        content = " ".join(text_parts).strip()

    if not isinstance(content, str) or not content.strip():
        return "Модель не вернула текстовый ответ."

    text = content.replace("Мухаммед", "Мухаммад")
    text = text.replace("**", "").replace("__", "")
    text = re.sub(r"[\U0001F300-\U0001FAFF]", "", text)

    banned_fragments = [
        "Я, Gemini Enterprise",
        "Я — Gemini Enterprise",
        "Я Gemini Enterprise",
        "Хотите узнать подробнее",
        "Gemini",
        "гемини",
        "нейросеть",
        "искусственный интеллект",
    ]
    for frag in banned_fragments:
        text = text.replace(frag, "")

    paragraphs = []
    current = []

    for raw in text.splitlines():
        line = raw.strip()

        if not line:
            if current:
                paragraphs.append(" ".join(current).strip())
                current = []
            continue

        if "|" in line:
            continue
        if set(line) <= {"-", "—", ":"}:
            continue

        if line.startswith("#"):
            line = line.lstrip("#").strip()
        if line.startswith("- "):
            line = line[2:].strip()
        if line.startswith("• "):
            line = line[2:].strip()

        current.append(line)

    if current:
        paragraphs.append(" ".join(current).strip())

    cleaned = []
    for p in paragraphs:
        while "  " in p:
            p = p.replace("  ", " ")
        p = p.strip()
        if p:
            cleaned.append(p)

    text = "\n\n".join(cleaned).strip()

    sentence_split = re.split(r"(?<=[.!?])\s+", text)
    drop_patterns = [
        "если хотите",
        "могу рассказать",
        "могу подробнее",
        "могу объяснить",
        "хотите",
        "о каком-то конкретном аспекте",
        "подсказать",
        "могу подсказать",
        "интересует",
    ]
    kept = []
    for s in sentence_split:
        low = s.lower()
        if any(p in low for p in drop_patterns):
            continue
        kept.append(s.strip())
    text = " ".join([s for s in kept if s]).strip()

    # Если ответ обрезался по лимиту токенов, закрываем его на последнем полном предложении.
    if text and text[-1] not in ".!?":
        last_end = max(text.rfind("."), text.rfind("!"), text.rfind("?"))
        if last_end != -1:
            text = text[: last_end + 1].strip()
        else:
            # Если знаков конца нет вообще, принудительно закрываем фразу.
            text = text.rstrip(",:; -") + "."

    if text.endswith("?"):
        text = text.rstrip("?").rstrip(".! ") + "."

    return text or "Не удалось сформировать корректный ответ."


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


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json or {}
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"success": False, "error": "Пустое сообщение"}), 400
    if len(message) > MAX_USER_CHARS:
        return jsonify({
            "success": False,
            "error": f"Сообщение слишком длинное. Максимум {MAX_USER_CHARS} символов."
        }), 400

    reply = ask_kie_gemini(message)
    return jsonify({"success": True, "response": reply})


if __name__ == '__main__':
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    
    print(f"Server starting...")
    print(f"Users file: {USERS_FILE}")
    print(f"Templates folder: {app.template_folder}")
    print(f"Static folder: {app.static_folder}")
    
    app.run(debug=True, port=5001, use_reloader=False) 
