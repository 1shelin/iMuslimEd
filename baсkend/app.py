from flask import Flask, render_template, request, jsonify
import hashlib
import os
import json
import re
from datetime import datetime
from zoneinfo import ZoneInfo
import html
import requests
from bs4 import BeautifulSoup

app = Flask(__name__, template_folder='../templates', static_folder='../static')

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
KIE_API_URL = "https://api.kie.ai/gemini-3-flash/v1/chat/completions"
MAX_HISTORY_MESSAGES = 300
MAX_HISTORY_TEXT_LEN = 2000

SYSTEM_PROMPT_BASE = (
    "Ты ассистент IMuslimEd. "
    "IMuslimEd — это цифровой информационный сервис для поддержки мусульманских студентов "
    "и развития межкультурных коммуникаций в инклюзивной образовательной среде. "
    "Темы: исламские традиции, религиозная практика, 4 суннитских мазхаба, "
    "студенческая адаптация, халяль-инфраструктура, межкультурное взаимодействие, функции сервиса. "
    "Ты не ученый и не выдаешь фетвы: давай только общую справочную информацию. "
    "Не давай медицинских, юридических, финансовых консультаций, не поддерживай радикальные или конфликтные трактовки. "
    "Если есть разногласия между мазхабами, перечисли позиции: ханафитский, маликитский, шафиитский, ханбалитский. "
    "Формат: допускается обычный текст, списки и markdown-таблицы, когда это улучшает понятность ответа. "
    "Допускается арабский текст с переводом и транскрипцией при религиозных вопросах. "
    "Не упоминай название модели, провайдера, слова нейросеть или ИИ. "
    "Начинай сразу с ответа, без приветствий. "
    "Отвечай кратко, по делу, завершённо. "
    "Если ответ не помещается, сокращай формулировки, но не обрывай мысль. "
    "Всегда заканчивай ответ итоговым предложением. "
    "Не задавай вопросов в конце."
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

MAX_USER_CHARS = int(os.environ.get("MAX_USER_CHARS", "400"))
MAX_OUTPUT_TOKENS = int(os.environ.get("MAX_OUTPUT_TOKENS", "220"))
KIE_TEMPERATURE = float(os.environ.get("KIE_TEMPERATURE", "0.2"))
PRAYER_CACHE = {}


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
        created_at = item.get("created_at")
        normalized_item = {
            "type": msg_type,
            "text": text[:MAX_HISTORY_TEXT_LEN]
        }
        if isinstance(created_at, str):
            created_at = created_at.strip()
            if created_at:
                try:
                    datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    normalized_item["created_at"] = created_at
                except ValueError:
                    pass
        cleaned.append(normalized_item)
    return cleaned


def normalize_iso_datetime(value):
    if not isinstance(value, str):
        return ""
    raw = value.strip()
    if not raw:
        return ""
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is not None:
            dt = dt.replace(tzinfo=None)
        return dt.isoformat()
    except ValueError:
        return ""


def is_valid_fio(value):
    normalized = (value or "").strip()
    if not normalized:
        return False
    normalized = re.sub(r"\s+", " ", normalized)
    pattern = r"^[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?(?: [А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)?){1,2}$"
    return re.fullmatch(pattern, normalized) is not None


def get_kie_api_key():
    return (os.environ.get("KIE_API_KEY") or "").strip()


def normalize_language(value):
    return "en" if str(value or "").strip().lower().startswith("en") else "ru"


def get_text_by_lang(lang, ru_text, en_text):
    return en_text if normalize_language(lang) == "en" else ru_text


def get_request_language(default="ru"):
    data = request.json if request.is_json else None
    query_lang = request.args.get("language")
    body_lang = data.get("language") if isinstance(data, dict) else None
    header_lang = request.headers.get("Accept-Language", "")
    return normalize_language(query_lang or body_lang or header_lang or default)


def build_system_prompt(lang):
    normalized = normalize_language(lang)
    if normalized == "en":
        return (
            SYSTEM_PROMPT_BASE + " "
            "Answer in English only. "
            "Use Muhammad spelling. "
            "If the question is outside your competence, reply exactly: "
            "“I cannot answer this question.”"
        )
    return (
        SYSTEM_PROMPT_BASE + " "
        "Отвечай только на русском языке. "
        "Пиши: Мухаммад (не Мухаммед). "
        "Если вопрос вне компетенции, напиши ровно: "
        "«Я не могу ответить на этот вопрос.»"
    )


def choose_response_max_tokens(user_message):
    text = (user_message or "").strip()
    if not text:
        return min(90, MAX_OUTPUT_TOKENS)

    words = [w for w in re.split(r"\s+", text) if w]
    words_count = len(words)
    chars_count = len(text)

    # Для коротких вопросов 
    if words_count <= 7 or chars_count <= 45:
        return min(90, MAX_OUTPUT_TOKENS)
    if words_count <= 16 or chars_count <= 120:
        return min(140, MAX_OUTPUT_TOKENS)
    return MAX_OUTPUT_TOKENS


def rule_based_navigation_answer(user_message, lang="ru"):
    text = (user_message or "").strip().lower()
    if not text:
        return ""

    def has_any(*parts):
        return any(p in text for p in parts)

    is_university_context = has_any("универ", "университет", "вуз", "муив", "витте", "уник", "кампус")
    is_moscow_context = has_any("москв", "мск", "moscow")

    is_prayer_time_question = (
        has_any("намаз", "намаза") and
        has_any("сейчас", "во сколько", "время", "когда", "какой сейчас") and
        has_any("сегодня", "текущ", "сейчас", "по москве", "по москве?", "мск", "москва")
    )
    is_general_prayer_time_question = (
        has_any("намаз", "намаза") and
        has_any(
            "во сколько", "время", "какое время", "когда", "какой намаз",
            "время намаза", "расписание намаза", "расписание намазов",
            "намаз сегодня", "намазы сегодня", "пора на намаз"
        )
    )
    if is_prayer_time_question or is_general_prayer_time_question:
        return get_text_by_lang(lang,
            "Я не показываю точное время намаза в чате, чтобы не дать неверные данные. "
            "Откройте раздел «Время намаза» — там актуальное расписание на сегодня.",
            "I do not provide exact prayer time in chat to avoid incorrect data. "
            "Open the “Prayer Time” section for today's schedule."
        )

    if (
        (
            has_any("халяль", "halal", "халял", "халель") and
            has_any(
                "где поесть", "поесть", "еда", "кафе", "ресторан", "рядом", "около", "поблизости", "где поесть рядом",
                "where to eat", "eat", "food", "cafe", "restaurant", "near", "nearby", "close to"
            )
        )
        or (
            has_any(
                "около уника", "около универа", "рядом с универом", "рядом с вузом", "около университета",
                "near university", "near uni", "near campus", "around campus", "close to university"
            ) and
            has_any("халяль", "halal", "халял")
        )
    ):
        return get_text_by_lang(
            lang,
            "Откройте раздел «Халяль рядом» — там отмечены халяль-кафе и рестораны рядом с университетом.",
            "Open the “Halal Nearby” section — it contains halal cafes and restaurants near the university."
        )

    if (
        has_any(
            "где помолиться", "где молиться", "где мечеть", "молельная", "молельн",
            "место для намаза", "комната для намаза", "где читать намаз",
            "где совершить намаз", "ближайшая мечеть", "мечеть рядом", "где молитвенная"
        )
    ):
        return get_text_by_lang(
            lang,
            "Откройте раздел «Мечеть / молельная» — там карта ближайших мест для молитвы.",
            "Open the “Mosque / Prayer Room” section — it has a map of nearby prayer places."
        )

    if has_any("часто задаваем", "faq", "чаво", "вопросы и ответы", "популярные вопросы"):
        return get_text_by_lang(
            lang,
            "Откройте раздел «Часто задаваемые вопросы» на главной — там собраны основные ответы по сервису и теме Ислама.",
            "Open the “FAQ” section on Home — it contains key answers about the service and Islam."
        )

    if (has_any("соц", "соцсети", "vk", "вк", "telegram", "телеграм", "тг") and is_university_context) or (
        has_any("где соцсети", "ссылки на соцсети", "ссылки муив", "где вк", "где тг") and is_university_context
    ):
        return get_text_by_lang(
            lang,
            "Соцсети МУИВ указаны иконками на «Главной»: VK и Telegram. "
            "Также ссылки: VK — https://vk.com/mosvitte, Telegram — https://t.me/mosvitte.",
            "MUIV social media are shown with icons on “Home”: VK and Telegram. "
            "Links: VK — https://vk.com/mosvitte, Telegram — https://t.me/mosvitte."
        )

    if is_university_context and not has_any("ислам", "религ", "намаз", "халяль", "мечет"):
        return get_text_by_lang(
            lang,
            "Речь о МУИВ — Московском университете имени С.Ю. Витте.",
            "This refers to MUIV — Moscow Witte University."
        )

    if has_any(
        "обратн", "куда обратиться", "связаться", "техподдержка", "поддержка", "support", "ошибка в приложении",
        "feedback", "contact", "how to contact", "technical support", "app issue", "bug", "report issue"
    ):
        return get_text_by_lang(lang, "Откройте «Настройки» → «Обратная связь».", "Open “Settings” → “Feedback”.")

    if has_any(
        "о сервисе", "расскажи о сервисе", "что за сервис", "что это за платформа", "imuslimed",
        "about service", "about the service", "tell me about the service", "what is this platform", "about imuslimed"
    ):
        return get_text_by_lang(
            lang,
            "Откройте «Настройки» → «О сервисе». Там описание целей платформы IMuslimEd, функций и принципов работы."
            ,
            "Open “Settings” → “About Service”. It explains IMuslimEd goals, features, and principles."
        )

    if has_any("главная", "открыть главную", "перейти на главную", "домой", "home", "open home", "go to home"):
        return get_text_by_lang(lang, "Откройте раздел «Главная» через меню.", "Open “Home” from the menu.")

    if has_any("настройки", "открыть настройки", "параметры", "settings", "open settings", "preferences"):
        return get_text_by_lang(lang, "Откройте раздел «Настройки» через меню.", "Open “Settings” from the menu.")

    if has_any("чат", "открыть чат", "задать вопрос", "перейти в чат", "chat", "open chat", "ask question", "go to chat"):
        return get_text_by_lang(lang, "Откройте раздел «Чат» через меню или кнопку «Задать вопрос».", "Open “Chat” from the menu or by pressing “Ask a Question”.")

    if has_any("очистить историю", "удалить переписку", "стереть историю", "clear history", "delete chat", "erase history", "clear chat history"):
        return get_text_by_lang(
            lang,
            "Очистка выполняется в разделе «Настройки» через пункт «Очистить историю чата».",
            "You can clear chat history in “Settings” via “Clear Chat History”."
        )

    return ""


def ask_kie_gemini(user_message, lang="ru"):
    normalized_lang = normalize_language(lang)
    rb = rule_based_navigation_answer(user_message, normalized_lang)
    if rb:
        return rb

    api_key = get_kie_api_key()
    if not api_key:
        print("[chat] missing API key")
        return get_text_by_lang(normalized_lang, "Ошибка подключения, повторите запрос.", "Connection error, please retry.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    def send_kie(payload):
        try:
            return requests.post(
                KIE_API_URL,
                headers=headers,
                json=payload,
                timeout=(6, 25),
            )
        except requests.ReadTimeout as e:
            print(f"[chat] timeout, retry once: {e}")
            try:
                return requests.post(
                    KIE_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=(6, 25),
                )
            except requests.RequestException as e2:
                print(f"[chat] network error after retry: {e2}")
                return None
        except requests.RequestException as e:
            print(f"[chat] network error: {e}")
            return None

    def extract_text_and_reason(response):
        if response is None:
            return "", "", get_text_by_lang(normalized_lang, "Ошибка подключения, повторите запрос.", "Connection error, please retry.")

        if response.status_code != 200:
            body_preview = (response.text or "").strip().replace("\n", " ")[:240]
            print(f"[chat] upstream status={response.status_code} body={body_preview}")
            return "", "", get_text_by_lang(normalized_lang, "Ошибка подключения, повторите запрос.", "Connection error, please retry.")

        try:
            data = response.json()
        except ValueError as e:
            print(f"[chat] invalid JSON: {e}; raw={response.text[:240] if response.text else ''}")
            return "", "", get_text_by_lang(normalized_lang, "Ошибка подключения, повторите запрос.", "Connection error, please retry.")

        choices = data.get("choices") or []
        if not choices:
            return "", "", get_text_by_lang(normalized_lang, "Пустой ответ от модели.", "Empty response from model.")

        first_choice = choices[0] if isinstance(choices[0], dict) else {}
        finish_reason = str(first_choice.get("finish_reason") or "").lower()
        message = first_choice.get("message", {})
        content = message.get("content", "")

        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    text_parts.append(part.get("text", ""))
            content = " ".join(text_parts).strip()

        if not isinstance(content, str) or not content.strip():
            return "", "", get_text_by_lang(normalized_lang, "Модель не вернула текстовый ответ.", "Model did not return a text response.")
        return content.strip(), finish_reason, ""

    def strip_unwanted_tail(text):
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        if not lines:
            return text.strip()

        banned_patterns = (
            "хотите ли вы",
            "если у вас возникнут",
            "вы хотели бы узнать",
            "о котором вы хотели бы узнать",
            "нужна помощь с планированием",
            "есть ли какой-то конкретный аспект",
            "я надеюсь",
            "would you like",
            "if you have any",
            "do you want to know",
            "which you would like to know",
            "need help with planning",
            "is there any specific aspect",
            "i hope",
        )

        while lines:
            low = lines[-1].lower()
            if any(p in low for p in banned_patterns):
                lines.pop()
                continue
            break
        return "\n".join(lines).strip()

    response_max_tokens = choose_response_max_tokens(user_message)
    base_payload = {
        "max_tokens": response_max_tokens,
        "temperature": KIE_TEMPERATURE,
        "messages": [
            {"role": "system", "content": build_system_prompt(normalized_lang)},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
    }

    response = send_kie(base_payload)
    content, finish_reason, error_text = extract_text_and_reason(response)
    if error_text:
        return error_text

    text = content.replace("Мухаммед", "Мухаммад").strip()
    text = strip_unwanted_tail(text)

    if finish_reason == "length":
        if text and text[-1] not in ".!?…":
            text += "…"

    text = strip_unwanted_tail(text)
    return text or get_text_by_lang(normalized_lang, "Не удалось сформировать корректный ответ.", "Failed to produce a valid response.")


def get_moscow_today():
    return datetime.now(ZoneInfo("Europe/Moscow")).strftime("%Y-%m-%d")


def parse_prayer_times_from_dumrf(raw_html):
    soup = BeautifulSoup(raw_html or "", "html.parser")
    text = soup.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)

    pattern = (
        r"Фаджр\s*(\d{2}:\d{2}).*?"
        r"(?:Шурук|Восход)\s*(\d{2}:\d{2}).*?"
        r"Зухр\s*(\d{2}:\d{2}).*?"
        r"Аср\s*(\d{2}:\d{2}).*?"
        r"Магриб\s*(\d{2}:\d{2}).*?"
        r"Иша\s*(\d{2}:\d{2})"
    )
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return None

    return {
        "success": True,
        "Fajr": match.group(1),
        "Sunrise": match.group(2),
        "Dhuhr": match.group(3),
        "Asr": match.group(4),
        "Maghrib": match.group(5),
        "Isha": match.group(6),
    }


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/auth', methods=['POST'])
def auth():
    data = request.json
    lang = get_request_language()
    login = data.get("login")
    password = data.get("password")

    if not login or not password:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Введите логин и пароль", "Enter login and password")})

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
                "error": get_text_by_lang(lang, "Неверный пароль", "Incorrect password")
            })

    # новый пользователь
    if len(login) < 3:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Логин должен содержать минимум 3 символа", "Login must be at least 3 characters")})
    if len(password) < 4:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пароль должен содержать минимум 4 символа", "Password must be at least 4 characters")})

    return jsonify({
        "success": True,
        "registered": False
    })


# сохранение ФИО
@app.route('/save_fio', methods=['POST'])
def save_fio():
    data = request.json
    lang = get_request_language()
    login = data.get("login")
    fio = data.get("fio")
    password = data.get("password")

    if not all([login, fio, password]):
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Не все данные предоставлены", "Not all required fields are provided")})

    # безопасная обработка ФИО
    fio = html.escape(re.sub(r"\s+", " ", fio.strip()))
    if not is_valid_fio(fio):
        return jsonify({
            "success": False,
            "error": get_text_by_lang(lang, "ФИО вводится на русском через пробелы: Фамилия Имя Отчество", "Full name must be in Russian with spaces: Surname Name Patronymic")
        })
    
    users = load_users()
    hashed_login = hash_value(login)
    hashed_password = hash_value(password)

    # проверка, что пользователь еще не зарегистрирован
    if hashed_login in users:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пользователь уже зарегистрирован", "User is already registered")})

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


@app.route('/prayer_times', methods=['GET'])
def prayer_times():
    lang = get_request_language()
    today = get_moscow_today()

    if PRAYER_CACHE.get("date") == today and isinstance(PRAYER_CACHE.get("data"), dict):
        return jsonify(PRAYER_CACHE["data"])

    try:
        response = requests.get(
            "https://dumrf.ru/",
            timeout=8,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"[prayer_times] network error: {e}")
        return jsonify({
            "success": False,
            "error": get_text_by_lang(lang, "Ошибка получения данных намаза", "Failed to load prayer times")
        }), 502

    parsed = parse_prayer_times_from_dumrf(response.text)
    if not parsed:
        print("[prayer_times] parse error")
        return jsonify({
            "success": False,
            "error": get_text_by_lang(lang, "Не удалось разобрать данные намаза", "Failed to parse prayer times")
        }), 500

    PRAYER_CACHE["date"] = today
    PRAYER_CACHE["data"] = parsed
    return jsonify(parsed)


@app.route('/chat_history', methods=['GET'])
def get_chat_history():
    lang = get_request_language()
    user_id = (request.args.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Не указан user_id", "user_id is required")}), 400

    users = load_users()
    user_data = users.get(user_id)
    if not user_data:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пользователь не найден", "User not found")}), 404

    history = sanitize_history(user_data.get("chat_history", []))
    account_created_at = normalize_iso_datetime(user_data.get("created_at", ""))
    if account_created_at:
        patched = []
        for item in history:
            if "created_at" in item:
                patched.append(item)
            else:
                enriched = dict(item)
                enriched["created_at"] = account_created_at
                patched.append(enriched)
        history = patched

    if user_data.get("chat_history") != history:
        user_data["chat_history"] = history
        save_users(users)
    return jsonify({"success": True, "history": history})


@app.route('/chat_history', methods=['POST'])
def save_chat_history_endpoint():
    data = request.json or {}
    lang = get_request_language()
    user_id = (data.get("user_id") or "").strip()
    history = data.get("history")

    if not user_id:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Не указан user_id", "user_id is required")}), 400

    users = load_users()
    user_data = users.get(user_id)
    if not user_data:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пользователь не найден", "User not found")}), 404

    cleaned_history = sanitize_history(history)
    user_data["chat_history"] = cleaned_history
    save_users(users)
    return jsonify({"success": True, "saved": len(cleaned_history)})


@app.route('/clear_chat_history', methods=['POST'])
def clear_chat_history():
    data = request.json or {}
    lang = get_request_language()
    user_id = (data.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Не указан user_id", "user_id is required")}), 400

    users = load_users()
    user_data = users.get(user_id)
    if not user_data:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пользователь не найден", "User not found")}), 404

    user_data["chat_history"] = []
    save_users(users)
    return jsonify({"success": True})


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json or {}
    message = (data.get("message") or "").strip()
    lang = normalize_language(data.get("language"))

    if not message:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пустое сообщение", "Empty message")}), 400
    if len(message) > MAX_USER_CHARS:
        return jsonify({
            "success": False,
            "error": get_text_by_lang(lang, f"Сообщение слишком длинное. Максимум {MAX_USER_CHARS} символов.", f"Message is too long. Maximum {MAX_USER_CHARS} characters.")
        }), 400

    reply = ask_kie_gemini(message, lang)
    return jsonify({"success": True, "response": reply})


if __name__ == '__main__':
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    
    print(f"Server starting...")
    print(f"Users file: {USERS_FILE}")
    print(f"Templates folder: {app.template_folder}")
    print(f"Static folder: {app.static_folder}")
    
    app.run(debug=True, port=5000, use_reloader=False) 
