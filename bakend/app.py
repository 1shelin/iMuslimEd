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
MAX_HISTORY_MESSAGES = 300
MAX_HISTORY_TEXT_LEN = 2000

SYSTEM_PROMPT = (
    "Ты ассистент IMuslimEd. Отвечай по-русски, нейтрально, кратко и структурированно. "
    "Темы: исламские традиции, 4 суннитских мазхаба, студенческая адаптация, халяль-инфраструктура, "
    "межкультурное взаимодействие, функции сервиса. "
    "Если есть разногласия между мазхабами, перечисли позиции: ханафитский, маликитский, шафиитский, ханбалитский. "
    "Не выноси личные фетвы и не давай мед/юр/фин консультации. "
    "Если вопрос вне компетенции, напиши: "
    "«Данный вопрос требует консультации с квалифицированным специалистом или религиозным наставником. "
    "Сервис IMuslimEd предоставляет справочную информацию общего характера.» "
    "Формат: допускается обычный текст, списки и markdown-таблицы, когда это улучшает понятность ответа. "
    "Допускается арабский текст с переводом и транскрипцией при религиозных вопросах. "
    "Не упоминай название модели, провайдера, слово нейросеть или ИИ. "
    "Не задавай встречных вопросов в конце ответа. Пиши: Мухаммад (не Мухаммед). "
    "Начинай сразу с ответа, без приветствий, в конце не пиши никаких дополнений, только ответ на вопрос."
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
MAX_OUTPUT_TOKENS = int(os.environ.get("MAX_OUTPUT_TOKENS", "180"))
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


def sanitize_history(items):
    if not isinstance(items, list):
        return []
    cleaned = []
    for item in items[:MAX_HISTORY_MESSAGES]:
        if not isinstance(item, dict):
            continue
        msg_type = item.get("type")
        text = item.get("text")
        if msg_type not in ("user", "bot"):
            continue
        if not isinstance(text, str):
            continue
        text = text.strip()
        if not text:
            continue
        cleaned.append({
            "type": msg_type,
            "text": text[:MAX_HISTORY_TEXT_LEN]
        })
    return cleaned


def is_valid_fio(value):
    normalized = (value or "").strip()
    if not normalized:
        return False
    normalized = re.sub(r"\s+", " ", normalized)
    pattern = r"^[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?(?: [А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?){1,2}$"
    return re.fullmatch(pattern, normalized) is not None


def get_kie_api_key():
    return (os.environ.get("KIE_API_KEY") or "").strip()


def rule_based_navigation_answer(user_message):
    text = (user_message or "").strip().lower()
    if not text:
        return ""

    def has_any(*parts):
        return any(p in text for p in parts)

    is_university_context = has_any("универ", "университет", "вуз", "муив", "витте", "уник")

    is_prayer_time_question = (
        has_any("намаз", "намаза") and
        has_any("сейчас", "во сколько", "время", "когда", "какой сейчас") and
        has_any("москв", "сегодня", "текущ", "сейчас")
    )
    if is_prayer_time_question:
        return (
            "Я не показываю точное время намаза в чате, чтобы не дать неверные данные. "
            "Откройте раздел «Время намаза» — там актуальное расписание на сегодня."
        )

    if (
        (has_any("халяль", "halal") and has_any("где поесть", "поесть", "еда", "кафе", "ресторан", "рядом", "около", "поблизости"))
        or (has_any("около уника", "около универа", "рядом с универом", "рядом с вузом") and has_any("халяль", "halal"))
    ):
        return (
            "Откройте раздел «Халяль рядом» — там отмечены халяль-кафе и рестораны рядом с университетом."
        )

    if (
        has_any("где помолиться", "где молиться", "где мечеть", "молельная", "молельн", "место для намаза", "комната для намаза", "где читать намаз")
    ):
        return (
            "Откройте раздел «Мечеть / молельная» — там карта ближайших мест для молитвы."
        )

    if "часто задаваем" in text or text in {"faq", "чаво"}:
        return (
            "Откройте раздел «Часто задаваемые вопросы» на главной — там собраны основные ответы по сервису и теме Ислама."
        )

    if (has_any("соц", "соцсети", "vk", "вк", "telegram", "телеграм", "тг") and is_university_context) or (
        has_any("где соцсети", "ссылки на соцсети") and is_university_context
    ):
        return (
            "Соцсети МУИВ указаны иконками на «Главной»: VK и Telegram. "
            "Также ссылки: VK — https://vk.com/mosvitte, Telegram — https://t.me/mosvitte."
        )

    if is_university_context:
        return (
            "Речь о МУИВ — Московском университете имени С.Ю. Витте."
        )

    if "обратн" in text or "куда обратиться" in text or "связаться" in text:
        return (
            "Откройте «Настройки» → «Обратная связь» "
        )

    if "о сервисе" in text or "расскажи о сервисе" in text:
        return (
            "Откройте «Настройки» → «О сервисе». Там описание целей платформы IMuslimEd, функций и принципов работы."
        )

    return ""


def ask_kie_gemini(user_message):
    rb = rule_based_navigation_answer(user_message)
    if rb:
        return rb

    api_key = get_kie_api_key()
    if not api_key:
        print("[chat] missing API key")
        return "Ошибка подключения, повторите запрос."

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
            timeout=(6, 25),
        )
    except requests.ReadTimeout as e:
        print(f"[chat] timeout, retry once: {e}")
        try:
            response = requests.post(
                KIE_API_URL,
                headers=headers,
                json=payload,
                timeout=(6, 25),
            )
        except requests.RequestException as e2:
            print(f"[chat] network error after retry: {e2}")
            return "Ошибка подключения, повторите запрос."
    except requests.RequestException as e:
        print(f"[chat] network error: {e}")
        return "Ошибка подключения, повторите запрос."

    if response.status_code != 200:
        body_preview = (response.text or "").strip().replace("\n", " ")[:240]
        print(f"[chat] upstream status={response.status_code} body={body_preview}")
        return "Ошибка подключения, повторите запрос."

    try:
        data = response.json()
    except ValueError as e:
        print(f"[chat] invalid JSON: {e}; raw={response.text[:240] if response.text else ''}")
        return "Ошибка подключения, повторите запрос."

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

    text = content.replace("Мухаммед", "Мухаммад").strip()
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
            history = sanitize_history(user_data.get("chat_history", []))
            if user_data.get("chat_history") != history:
                user_data["chat_history"] = history
                save_users(users)
            return jsonify({
                "success": True,
                "registered": True,
                "fio": user_data.get("fio", ""),
                "user_id": hashed_login,
                "chat_history": history,
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
    fio = html.escape(re.sub(r"\s+", " ", fio.strip()))
    if not is_valid_fio(fio):
        return jsonify({
            "success": False,
            "error": "ФИО вводится на русском через пробелы: Фамилия Имя Отчество"
        })
    
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
        "chat_history": [],
        "created_at": datetime.now().isoformat()
    }

    save_users(users)
    return jsonify({"success": True, "user_id": hashed_login, "chat_history": []})


@app.route('/check_auth', methods=['GET'])
def check_auth():
    """Проверка статуса авторизации (необязательно, можно использовать для проверки сессии)"""
    return jsonify({"authenticated": False})


@app.route('/chat_history', methods=['GET'])
def get_chat_history():
    user_id = (request.args.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"success": False, "error": "Не указан user_id"}), 400

    users = load_users()
    user_data = users.get(user_id)
    if not user_data:
        return jsonify({"success": False, "error": "Пользователь не найден"}), 404

    history = sanitize_history(user_data.get("chat_history", []))
    if user_data.get("chat_history") != history:
        user_data["chat_history"] = history
        save_users(users)
    return jsonify({"success": True, "history": history})


@app.route('/chat_history', methods=['POST'])
def save_chat_history_endpoint():
    data = request.json or {}
    user_id = (data.get("user_id") or "").strip()
    history = data.get("history")

    if not user_id:
        return jsonify({"success": False, "error": "Не указан user_id"}), 400

    users = load_users()
    user_data = users.get(user_id)
    if not user_data:
        return jsonify({"success": False, "error": "Пользователь не найден"}), 404

    cleaned_history = sanitize_history(history)
    user_data["chat_history"] = cleaned_history
    save_users(users)
    return jsonify({"success": True, "saved": len(cleaned_history)})


@app.route('/clear_chat_history', methods=['POST'])
def clear_chat_history():
    data = request.json or {}
    user_id = (data.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"success": False, "error": "Не указан user_id"}), 400

    users = load_users()
    user_data = users.get(user_id)
    if not user_data:
        return jsonify({"success": False, "error": "Пользователь не найден"}), 404

    user_data["chat_history"] = []
    save_users(users)
    return jsonify({"success": True})


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
    
    app.run(debug=True, port=5000, use_reloader=False) 