from flask import Flask, render_template, request, jsonify, redirect
import hashlib
import os
import json
import re
import shutil
import tempfile
from functools import wraps
from datetime import datetime
from zoneinfo import ZoneInfo
import html
import requests
from bs4 import BeautifulSoup
from werkzeug.middleware.proxy_fix import ProxyFix

BACKEND_DIR = os.path.dirname(__file__)
BASE_DIR = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__, template_folder=TEMPLATES_DIR, static_folder=STATIC_DIR)

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), "audit_log.json")
FAQ_FILE = os.path.join(os.path.dirname(__file__), "faq_content.json")
INFO_CONTENT_FILE = os.path.join(os.path.dirname(__file__), "info_content.json")
MAP_POINTS_FILE = os.path.join(os.path.dirname(__file__), "map_points.json")
SYSTEM_SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "system_settings.json")
MODERATION_STATE_FILE = os.path.join(os.path.dirname(__file__), "moderation_state.json")
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

REQUIRE_HTTPS = os.environ.get("REQUIRE_HTTPS", "0").strip().lower() in {"1", "true", "yes", "on"}
TRUST_PROXY_HEADERS = os.environ.get("TRUST_PROXY_HEADERS", "1").strip().lower() in {"1", "true", "yes", "on"}
if TRUST_PROXY_HEADERS:
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

app.config["SESSION_COOKIE_SECURE"] = REQUIRE_HTTPS
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


def _backup_path(file_path):
    return f"{file_path}.bak"


def _atomic_write_json(file_path, data):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    backup_file = _backup_path(file_path)
    if os.path.exists(file_path):
        try:
            shutil.copy2(file_path, backup_file)
        except Exception as e:
            print(f"Warning: failed to backup {file_path}: {e}")

    tmp_file = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=os.path.dirname(file_path), delete=False) as tmp:
            tmp_file = tmp.name
            json.dump(data, tmp, indent=2, ensure_ascii=False)
            tmp.flush()
            os.fsync(tmp.fileno())
        os.replace(tmp_file, file_path)
    except Exception:
        if tmp_file and os.path.exists(tmp_file):
            try:
                os.remove(tmp_file)
            except Exception:
                pass
        raise


def _load_json_with_recovery(file_path, expected_type, default_value):
    backup_file = _backup_path(file_path)
    if not os.path.exists(file_path) and not os.path.exists(backup_file):
        return default_value

    def _read(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    if os.path.exists(file_path):
        try:
            data = _read(file_path)
            if isinstance(data, expected_type):
                return data
            print(f"Warning: invalid JSON type in {file_path}, expected {expected_type.__name__}")
        except Exception as e:
            print(f"Warning: failed to read {file_path}: {e}")

    if os.path.exists(backup_file):
        try:
            data = _read(backup_file)
            if isinstance(data, expected_type):
                print(f"Recovery: restored {file_path} from backup")
                _atomic_write_json(file_path, data)
                return data
            print(f"Warning: invalid JSON type in {backup_file}, expected {expected_type.__name__}")
        except Exception as e:
            print(f"Warning: failed to read backup {backup_file}: {e}")

    return default_value

MAX_USER_CHARS = int(os.environ.get("MAX_USER_CHARS", "400"))
MAX_OUTPUT_TOKENS = int(os.environ.get("MAX_OUTPUT_TOKENS", "220"))
KIE_TEMPERATURE = float(os.environ.get("KIE_TEMPERATURE", "0.2"))
PRAYER_CACHE = {}
VALID_ROLES = {"student", "curator", "admin"}
ROLE_RANK = {"student": 1, "curator": 2, "admin": 3}
ROLE_ALIASES = {"mentor": "curator"}
BOOTSTRAP_ADMIN_IDS = {
    "6022fb3b7ac8ff74f8a0db76a3d2bb37e9044ca946ffdbf68aa079762dea70eb"
}


def hash_value(value):
    return hashlib.sha256(value.encode()).hexdigest()


def normalize_role(value, default="student"):
    role = ROLE_ALIASES.get(str(value or "").strip().lower(), str(value or "").strip().lower())
    return role if role in VALID_ROLES else default


def parse_login_list_from_env(key):
    raw = os.environ.get(key, "")
    if not raw:
        return set()
    return {item.strip().lower() for item in raw.split(",") if item.strip()}


def parse_user_id_list_from_env(key):
    raw = os.environ.get(key, "")
    if not raw:
        return set()
    return {item.strip() for item in raw.split(",") if item.strip()}


def is_bootstrap_admin_user_id(user_id):
    normalized = str(user_id or "").strip()
    if not normalized:
        return False
    return normalized in BOOTSTRAP_ADMIN_IDS or normalized in parse_user_id_list_from_env("ADMIN_USER_IDS")


def resolve_role_for_login(login, fallback="student"):
    normalized_login = str(login or "").strip().lower()
    if normalized_login in parse_login_list_from_env("ADMIN_LOGINS"):
        return "admin"
    if normalized_login in parse_login_list_from_env("CURATOR_LOGINS"):
        return "curator"
    # backward compatibility with old env key
    if normalized_login in parse_login_list_from_env("MENTOR_LOGINS"):
        return "curator"
    return normalize_role(fallback)


def get_user_role(user_data, user_id=None):
    if is_bootstrap_admin_user_id(user_id):
        return "admin"
    if not isinstance(user_data, dict):
        return "student"
    return normalize_role(user_data.get("role"))


def role_has_access(user_role, required_role):
    return ROLE_RANK.get(normalize_role(user_role), 0) >= ROLE_RANK.get(normalize_role(required_role), 0)


def get_user_by_id(user_id):
    users = load_users()
    user_data = users.get(user_id)
    return users, user_data


def is_user_blocked(user_data):
    return bool(user_data.get("blocked", False)) if isinstance(user_data, dict) else False


def require_role(required_role):
    def decorator(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            lang = get_request_language()
            data = request.json if request.is_json else {}
            actor_user_id = (request.args.get("actor_user_id") or data.get("actor_user_id") or "").strip()
            if not actor_user_id:
                return jsonify({
                    "success": False,
                    "error": get_text_by_lang(lang, "Не указан actor_user_id", "actor_user_id is required")
                }), 400

            _, actor = get_user_by_id(actor_user_id)
            if not actor:
                return jsonify({
                    "success": False,
                    "error": get_text_by_lang(lang, "Пользователь не найден", "User not found")
                }), 404
            if is_user_blocked(actor):
                return jsonify({
                    "success": False,
                    "error": get_text_by_lang(lang, "Аккаунт заблокирован", "Account is blocked")
                }), 403

            actor_role = get_user_role(actor, actor_user_id)
            if not role_has_access(actor_role, required_role):
                return jsonify({
                    "success": False,
                    "error": get_text_by_lang(lang, "Недостаточно прав доступа", "Access denied"),
                    "role": actor_role,
                    "required_role": required_role
                }), 403

            return fn(*args, **kwargs)
        return wrapped
    return decorator


def requireRole(required_role):
    return require_role(required_role)


def load_users():
    users = _load_json_with_recovery(USERS_FILE, dict, {})
    if not isinstance(users, dict):
        return {}
    changed = False
    normalized_users = {}
    for user_id, user_data in users.items():
        normalized = normalize_user_record(user_data)
        if is_bootstrap_admin_user_id(user_id):
            normalized["role"] = "admin"
        normalized_users[user_id] = normalized
        if normalized != user_data:
            changed = True
    if changed:
        save_users(normalized_users)
    return normalized_users


def save_users(users):
    try:
        _atomic_write_json(USERS_FILE, users)
    except Exception as e:
        print(f"Error saving users: {e}")


def load_json_list(file_path):
    data = _load_json_with_recovery(file_path, list, [])
    return data if isinstance(data, list) else []


def save_json(file_path, data):
    try:
        _atomic_write_json(file_path, data)
    except Exception as e:
        print(f"Error saving {file_path}: {e}")


def append_audit_log(user_id, action, entity, before=None, after=None):
    logs = load_json_list(AUDIT_LOG_FILE)
    logs.append({
        "created_at": datetime.now().isoformat(),
        "user_id": user_id,
        "action": action,
        "entity": entity,
        "before": before if isinstance(before, dict) else {},
        "after": after if isinstance(after, dict) else {}
    })
    if len(logs) > 5000:
        logs = logs[-5000:]
    save_json(AUDIT_LOG_FILE, logs)


def load_faq_content():
    if not os.path.exists(FAQ_FILE):
        default_content = {
            "updated_at": datetime.now().isoformat(),
            "items": []
        }
        save_json(FAQ_FILE, default_content)
        return default_content
    data = _load_json_with_recovery(FAQ_FILE, dict, {"updated_at": datetime.now().isoformat(), "items": []})
    if not isinstance(data, dict):
        return {"updated_at": datetime.now().isoformat(), "items": []}
    items = data.get("items", [])
    if not isinstance(items, list):
        items = []
    cleaned_items = []
    for item in items:
        if not isinstance(item, dict):
            continue
        question = str(item.get("question") or "").strip()
        answer = str(item.get("answer") or "").strip()
        if question and answer:
            cleaned_items.append({"question": question[:300], "answer": answer[:2000]})
    return {
        "updated_at": normalize_iso_datetime(data.get("updated_at")) or datetime.now().isoformat(),
        "items": cleaned_items
    }


def save_faq_content(payload):
    save_json(FAQ_FILE, payload)


def load_info_content():
    default_content = {
        "updated_at": "",
        "content": {"ru": "", "en": "", "ar": ""}
    }
    if not os.path.exists(INFO_CONTENT_FILE):
        save_json(INFO_CONTENT_FILE, default_content)
        return default_content
    data = _load_json_with_recovery(INFO_CONTENT_FILE, dict, default_content)
    if not isinstance(data, dict):
        return default_content
    content = data.get("content", {})
    if not isinstance(content, dict):
        content = {}
    return {
        "updated_at": normalize_iso_datetime(data.get("updated_at")) or "",
        "content": {
            "ru": str(content.get("ru") or ""),
            "en": str(content.get("en") or ""),
            "ar": str(content.get("ar") or ""),
        }
    }


def save_info_content(payload):
    save_json(INFO_CONTENT_FILE, payload)


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _sanitize_map_points(items):
    if not isinstance(items, list):
        return []
    cleaned = []
    for item in items:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        lat = _to_float(item.get("lat"))
        lon = _to_float(item.get("lon"))
        if lon is None:
            lon = _to_float(item.get("lng"))
        if not name or lat is None or lon is None:
            continue
        cleaned.append({
            "name": name[:120],
            "lat": round(lat, 6),
            "lon": round(lon, 6),
        })
    return cleaned


def _default_map_points_payload():
    return {
        "updated_at": "",
        "points": {
            "halal": [
                {"name": "Ресторан 'Шафран'", "lat": 55.699634, "lon": 37.657776},
                {"name": "Кафе 'Non gusht'", "lat": 55.700903, "lon": 37.651461},
                {"name": "Кафе 'Сочный вертел'", "lat": 55.694225, "lon": 37.665306},
                {"name": "Кафе 'Плов&бургер'", "lat": 55.700121, "lon": 37.657538},
                {"name": "Кофейня 'Здрасте'", "lat": 55.690114, "lon": 37.654806},
            ],
            "mosque": [
                {"name": "Наследие Ислама", "lat": 55.7176, "lon": 37.6375},
                {"name": "Мечеть 'Соборная'", "lat": 55.779167, "lon": 37.626944},
                {"name": "Мечеть 'Ярдэм'", "lat": 55.856667, "lon": 37.592222},
                {"name": "Мечеть 'Мемориальная'", "lat": 55.725377, "lon": 37.497144},
                {"name": "Мечеть 'Историческая'", "lat": 55.738803, "lon": 37.632483},
            ]
        }
    }


def load_map_points():
    default_payload = _default_map_points_payload()
    if not os.path.exists(MAP_POINTS_FILE):
        save_json(MAP_POINTS_FILE, default_payload)
        return default_payload
    data = _load_json_with_recovery(MAP_POINTS_FILE, dict, default_payload)
    if not isinstance(data, dict):
        return default_payload
    points = data.get("points", {})
    if not isinstance(points, dict):
        points = {}
    return {
        "updated_at": normalize_iso_datetime(data.get("updated_at")) or "",
        "points": {
            "halal": _sanitize_map_points(points.get("halal", [])),
            "mosque": _sanitize_map_points(points.get("mosque", []))
        }
    }


def save_map_points(payload):
    save_json(MAP_POINTS_FILE, payload)


def _default_system_settings():
    return {
        "updated_at": "",
        "settings": {
            "maintenance_mode": False,
            "registration_enabled": True,
            "chat_enabled": True,
            "max_user_chars": MAX_USER_CHARS,
            "max_history_messages": MAX_HISTORY_MESSAGES,
            "max_history_text_len": MAX_HISTORY_TEXT_LEN,
        }
    }


def load_system_settings():
    default_payload = _default_system_settings()
    if not os.path.exists(SYSTEM_SETTINGS_FILE):
        save_json(SYSTEM_SETTINGS_FILE, default_payload)
        return default_payload
    data = _load_json_with_recovery(SYSTEM_SETTINGS_FILE, dict, default_payload)
    if not isinstance(data, dict):
        return default_payload
    raw = data.get("settings", {})
    if not isinstance(raw, dict):
        raw = {}
    merged = dict(default_payload["settings"])
    merged.update(raw)
    merged["maintenance_mode"] = bool(merged.get("maintenance_mode", False))
    merged["registration_enabled"] = bool(merged.get("registration_enabled", True))
    merged["chat_enabled"] = bool(merged.get("chat_enabled", True))
    merged["max_user_chars"] = max(100, min(2000, int(merged.get("max_user_chars", MAX_USER_CHARS))))
    merged["max_history_messages"] = max(50, min(1000, int(merged.get("max_history_messages", MAX_HISTORY_MESSAGES))))
    merged["max_history_text_len"] = max(200, min(5000, int(merged.get("max_history_text_len", MAX_HISTORY_TEXT_LEN))))
    return {
        "updated_at": normalize_iso_datetime(data.get("updated_at")) or "",
        "settings": merged
    }


def save_system_settings(payload):
    save_json(SYSTEM_SETTINGS_FILE, payload)


def _default_moderation_state():
    return {
        "updated_at": "",
        "hidden_messages": []
    }


def load_moderation_state():
    default_payload = _default_moderation_state()
    if not os.path.exists(MODERATION_STATE_FILE):
        save_json(MODERATION_STATE_FILE, default_payload)
        return default_payload
    data = _load_json_with_recovery(MODERATION_STATE_FILE, dict, default_payload)
    if not isinstance(data, dict):
        return default_payload
    hidden = data.get("hidden_messages", [])
    if not isinstance(hidden, list):
        hidden = []
    normalized_hidden = []
    for item in hidden:
        key = str(item or "").strip()
        if key:
            normalized_hidden.append(key[:220])
    return {
        "updated_at": normalize_iso_datetime(data.get("updated_at")) or "",
        "hidden_messages": normalized_hidden
    }


@app.before_request
def enforce_https():
    if not REQUIRE_HTTPS:
        return None
    host = (request.host or "").split(":")[0].strip().lower()
    if host in {"127.0.0.1", "localhost"}:
        return None
    if request.is_secure:
        return None
    secure_url = request.url.replace("http://", "https://", 1)
    return redirect(secure_url, code=308)


@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Permissions-Policy"] = "geolocation=()"
    if REQUIRE_HTTPS and request.is_secure:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    if request.path.startswith("/auth") or request.path.startswith("/me") or request.path.startswith("/chat"):
        response.headers["Cache-Control"] = "no-store"
    return response


def save_moderation_state(payload):
    save_json(MODERATION_STATE_FILE, payload)


def build_message_key(user_id, msg_index, message_item):
    created_at = str(message_item.get("created_at") or "").strip()
    tail = created_at or str(msg_index)
    return f"{user_id}:{tail}"[:220]


def collect_user_messages(limit=120):
    users = load_users()
    rows = []
    for user_id, user_data in users.items():
        fio = str(user_data.get("fio") or "")
        history = sanitize_history(user_data.get("chat_history", []))
        for idx, item in enumerate(history):
            if item.get("type") != "user":
                continue
            rows.append({
                "key": build_message_key(user_id, idx, item),
                "user_id": user_id,
                "fio": fio,
                "text": str(item.get("text") or "")[:MAX_HISTORY_TEXT_LEN],
                "created_at": str(item.get("created_at") or "")
            })
    rows.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return rows[:max(1, min(500, int(limit)))]


def normalize_user_record(user_data):
    if not isinstance(user_data, dict):
        return {}
    normalized = dict(user_data)
    normalized["role"] = normalize_role(user_data.get("role"))
    normalized["blocked"] = bool(user_data.get("blocked", False))
    normalized["chat_history"] = sanitize_history(user_data.get("chat_history", []))
    return normalized


def user_public_view(user_id, user_data):
    return {
        "user_id": user_id,
        "fio": user_data.get("fio", ""),
        "role": get_user_role(user_data, user_id),
        "blocked": bool(user_data.get("blocked", False)),
        "created_at": normalize_iso_datetime(user_data.get("created_at", "")),
        "chat_messages": len(sanitize_history(user_data.get("chat_history", []))),
    }


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
    normalized = str(value or "").strip().lower()
    if normalized.startswith("en"):
        return "en"
    if normalized.startswith("ar"):
        return "ar"
    return "ru"


EN_TO_AR_TEXT = {
    "I do not provide exact prayer time in chat to avoid incorrect data. Open the “Prayer Time” section for today's schedule.": "لا أقدّم أوقات الصلاة الدقيقة داخل الدردشة لتجنّب البيانات غير الصحيحة. افتح قسم «وقت الصلاة» للاطلاع على جدول اليوم.",
    "Open the “Halal Nearby” section — it contains halal cafes and restaurants near the university.": "افتح قسم «حلال قريب» — ستجد فيه مقاهي ومطاعم حلال قرب الجامعة.",
    "Open the “Mosque / Prayer Room” section — it has a map of nearby prayer places.": "افتح قسم «المسجد / المصلى» — يحتوي على خريطة لأماكن الصلاة القريبة.",
    "Open the “FAQ” section on Home — it contains key answers about the service and Islam.": "افتح قسم «الأسئلة الشائعة» في الرئيسية — ستجد أهم الإجابات عن الخدمة والإسلام.",
    "MUIV social media are shown with icons on “Home”: VK and Telegram. Links: VK — https://vk.com/mosvitte, Telegram — https://t.me/mosvitte.": "تظهر حسابات MUIV على «الرئيسية» عبر أيقونتي VK وTelegram. الروابط: VK — https://vk.com/mosvitte، Telegram — https://t.me/mosvitte.",
    "This refers to MUIV — Moscow Witte University.": "المقصود هو MUIV — جامعة موسكو ويتي.",
    "Open “Settings” → “Feedback”.": "افتح «الإعدادات» → «الملاحظات».",
    "Open “Settings” → “About Service”. It explains IMuslimEd goals, features, and principles.": "افتح «الإعدادات» → «حول الخدمة». ستجد شرحًا لأهداف IMuslimEd وميزاته ومبادئه.",
    "Open “Home” from the menu.": "افتح «الرئيسية» من القائمة.",
    "Open “Settings” from the menu.": "افتح «الإعدادات» من القائمة.",
    "Open “Chat” from the menu or by pressing “Ask a Question”.": "افتح «الدردشة» من القائمة أو عبر زر «اطرح سؤالًا».",
    "You can clear chat history in “Settings” via “Clear Chat History”.": "يمكنك مسح سجل الدردشة من «الإعدادات» عبر «مسح سجل الدردشة».",
    "Connection error, please retry.": "خطأ في الاتصال، يُرجى إعادة المحاولة.",
    "Empty response from model.": "استجابة النموذج فارغة.",
    "Model did not return a text response.": "لم يُرجع النموذج استجابة نصية.",
    "Failed to produce a valid response.": "تعذر إنشاء استجابة صالحة.",
    "Enter login and password": "أدخل اسم المستخدم وكلمة المرور",
    "Incorrect password": "كلمة المرور غير صحيحة",
    "Login must be at least 3 characters": "يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل",
    "Password must be at least 4 characters": "يجب أن تتكون كلمة المرور من 4 أحرف على الأقل",
    "Not all required fields are provided": "لم يتم توفير جميع البيانات المطلوبة",
    "Full name must be in Russian with spaces: Surname Name Patronymic": "يجب إدخال الاسم الكامل بالروسية مع مسافات: اللقب الاسم اسم الأب",
    "User is already registered": "المستخدم مسجل بالفعل",
    "Failed to load prayer times": "تعذر تحميل أوقات الصلاة",
    "Failed to parse prayer times": "تعذر تحليل بيانات أوقات الصلاة",
    "user_id is required": "حقل user_id مطلوب",
    "User not found": "المستخدم غير موجود",
    "Empty message": "الرسالة فارغة",
    "Account is blocked": "تم حظر الحساب",
    "Invalid role": "الدور غير صالح",
    "target_user_id is required": "حقل target_user_id مطلوب",
    "role is required": "حقل role مطلوب",
    "user_id and password are required": "حقلا user_id وكلمة المرور مطلوبان",
    "Cannot block yourself": "لا يمكنك حظر نفسك",
    "Invalid FAQ payload": "تنسيق بيانات الأسئلة الشائعة غير صالح",
}


def translate_en_to_ar(en_text):
    normalized = str(en_text or "").strip()
    if not normalized:
        return "حدث خطأ غير متوقع."
    if normalized in EN_TO_AR_TEXT:
        return EN_TO_AR_TEXT[normalized]

    too_long_match = re.fullmatch(r"Message is too long\. Maximum (\d+) characters\.", normalized)
    if too_long_match:
        return f"الرسالة طويلة جدًا. الحد الأقصى {too_long_match.group(1)} حرفًا."

    return normalized


def get_text_by_lang(lang, ru_text, en_text, ar_text=None):
    normalized = normalize_language(lang)
    if normalized == "ar":
        return ar_text if ar_text is not None else translate_en_to_ar(en_text)
    if normalized == "en":
        return en_text
    return ru_text


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
    if normalized == "ar":
        return (
            SYSTEM_PROMPT_BASE + " "
            "أجب باللغة العربية فقط. "
            "اكتب اسم النبي بصيغة: محمد. "
            "إذا كان السؤال خارج نطاق اختصاصك، فاكتب حرفيًا: "
            "«لا أستطيع الإجابة على هذا السؤال.»"
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
        user_data = normalize_user_record(users[hashed_login])
        users[hashed_login] = user_data
        
        if user_data["password"] == hashed_password:
            if is_user_blocked(user_data):
                return jsonify({
                    "success": False,
                    "error": get_text_by_lang(lang, "Аккаунт заблокирован", "Account is blocked")
                }), 403
            history = sanitize_history(user_data.get("chat_history", []))
            if user_data.get("chat_history") != history:
                user_data["chat_history"] = history
                save_users(users)
            return jsonify({
                "success": True,
                "registered": True,
                "fio": user_data.get("fio", ""),
                "user_id": hashed_login,
                "role": get_user_role(user_data, hashed_login),
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
        "registered": False,
        "role": resolve_role_for_login(login, "student")
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
        "role": resolve_role_for_login(login, "student"),
        "blocked": False,
        "chat_history": [],
        "created_at": datetime.now().isoformat()
    }

    save_users(users)
    append_audit_log(
        user_id=hashed_login,
        action="user_registered",
        entity="user",
        before={},
        after={"user_id": hashed_login, "role": users[hashed_login]["role"]}
    )
    return jsonify({
        "success": True,
        "user_id": hashed_login,
        "role": users[hashed_login]["role"],
        "chat_history": []
    })


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
    if is_user_blocked(user_data):
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Аккаунт заблокирован", "Account is blocked")}), 403

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
    if is_user_blocked(user_data):
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Аккаунт заблокирован", "Account is blocked")}), 403

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
    if is_user_blocked(user_data):
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Аккаунт заблокирован", "Account is blocked")}), 403

    old_count = len(sanitize_history(user_data.get("chat_history", [])))
    user_data["chat_history"] = []
    save_users(users)
    append_audit_log(
        user_id=user_id,
        action="chat_history_cleared",
        entity="chat_history",
        before={"user_id": user_id, "messages_count": old_count},
        after={"user_id": user_id, "messages_count": 0}
    )
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


@app.route('/me', methods=['GET'])
def me():
    lang = get_request_language()
    user_id = (request.args.get("user_id") or "").strip()
    if not user_id:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Не указан user_id", "user_id is required")}), 400

    users = load_users()
    user_data = users.get(user_id)
    if not user_data:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пользователь не найден", "User not found")}), 404

    return jsonify({
        "success": True,
        "user_id": user_id,
        "fio": user_data.get("fio", ""),
        "role": get_user_role(user_data, user_id),
        "blocked": is_user_blocked(user_data),
    })


@app.route('/account/delete', methods=['POST'])
def delete_account():
    data = request.json or {}
    lang = get_request_language()
    user_id = (data.get("user_id") or "").strip()
    password = str(data.get("password") or "")
    if not user_id or not password:
        return jsonify({
            "success": False,
            "error": get_text_by_lang(lang, "Не указан user_id или пароль", "user_id and password are required")
        }), 400

    users = load_users()
    user_data = users.get(user_id)
    if not user_data:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пользователь не найден", "User not found")}), 404

    if user_data.get("password") != hash_value(password):
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Неверный пароль", "Incorrect password")}), 403

    before_payload = {
        "user_id": user_id,
        "role": get_user_role(user_data, user_id),
        "chat_messages": len(sanitize_history(user_data.get("chat_history", [])))
    }
    users.pop(user_id, None)
    save_users(users)
    append_audit_log(
        user_id=user_id,
        action="account_deleted",
        entity="user",
        before=before_payload,
        after={}
    )
    return jsonify({"success": True})


@app.route('/admin/users', methods=['GET'])
@requireRole("admin")
def admin_users():
    users = load_users()
    ordered = sorted(
        [user_public_view(user_id, user_data) for user_id, user_data in users.items()],
        key=lambda item: item.get("created_at") or ""
    )
    return jsonify({"success": True, "users": ordered})


@app.route('/admin/set_role', methods=['POST'])
@requireRole("admin")
def admin_set_role():
    data = request.json or {}
    lang = get_request_language()
    actor_user_id = (data.get("actor_user_id") or "").strip()
    target_user_id = (data.get("target_user_id") or "").strip()
    target_role = normalize_role(data.get("role"), default="")

    if not target_user_id:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Не указан target_user_id", "target_user_id is required")}), 400
    if not target_role:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Не указана роль", "role is required")}), 400
    if target_role not in VALID_ROLES:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Недопустимая роль", "Invalid role")}), 400

    users = load_users()
    target_user = users.get(target_user_id)
    if not target_user:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пользователь не найден", "User not found")}), 404

    old_role = get_user_role(target_user, target_user_id)
    target_user["role"] = target_role
    users[target_user_id] = target_user
    save_users(users)
    append_audit_log(
        user_id=actor_user_id,
        action="set_role",
        entity="user",
        before={"user_id": target_user_id, "role": old_role},
        after={"user_id": target_user_id, "role": target_role}
    )
    return jsonify({"success": True, "user_id": target_user_id, "role": target_role})


@app.route('/admin/set_block', methods=['POST'])
@requireRole("admin")
def admin_set_block():
    data = request.json or {}
    lang = get_request_language()
    actor_user_id = (data.get("actor_user_id") or "").strip()
    target_user_id = (data.get("target_user_id") or "").strip()
    blocked = bool(data.get("blocked"))

    if not target_user_id:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Не указан target_user_id", "target_user_id is required")}), 400

    users = load_users()
    target_user = users.get(target_user_id)
    if not target_user:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пользователь не найден", "User not found")}), 404

    old_blocked = bool(target_user.get("blocked", False))
    target_user["blocked"] = blocked
    users[target_user_id] = target_user
    save_users(users)
    append_audit_log(
        user_id=actor_user_id,
        action="set_block",
        entity="user",
        before={"user_id": target_user_id, "blocked": old_blocked},
        after={"user_id": target_user_id, "blocked": blocked}
    )
    return jsonify({"success": True, "user_id": target_user_id, "blocked": blocked})


@app.route('/admin/audit_log', methods=['GET'])
@requireRole("admin")
def admin_audit_log():
    logs = load_json_list(AUDIT_LOG_FILE)
    return jsonify({"success": True, "items": logs[-200:]})


@app.route('/admin/system_settings', methods=['GET'])
@requireRole("admin")
def admin_get_system_settings():
    return jsonify({"success": True, "content": load_system_settings()})


@app.route('/admin/system_settings', methods=['POST'])
@requireRole("admin")
def admin_save_system_settings():
    data = request.json or {}
    lang = get_request_language()
    actor_user_id = (data.get("actor_user_id") or "").strip()
    settings = data.get("settings")
    if not isinstance(settings, dict):
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Некорректные настройки", "Invalid settings payload")}), 400

    previous = load_system_settings()
    merged = dict(previous.get("settings", {}))
    merged.update(settings)
    payload = {
        "updated_at": datetime.now().isoformat(),
        "settings": {
            "maintenance_mode": bool(merged.get("maintenance_mode", False)),
            "registration_enabled": bool(merged.get("registration_enabled", True)),
            "chat_enabled": bool(merged.get("chat_enabled", True)),
            "max_user_chars": max(100, min(2000, int(merged.get("max_user_chars", MAX_USER_CHARS)))),
            "max_history_messages": max(50, min(1000, int(merged.get("max_history_messages", MAX_HISTORY_MESSAGES)))),
            "max_history_text_len": max(200, min(5000, int(merged.get("max_history_text_len", MAX_HISTORY_TEXT_LEN))))
        }
    }
    save_system_settings(payload)
    append_audit_log(
        user_id=actor_user_id,
        action="system_settings_updated",
        entity="system_settings",
        before=previous.get("settings", {}),
        after=payload.get("settings", {})
    )
    return jsonify({"success": True, "content": payload})


@app.route('/admin/metrics', methods=['GET'])
@requireRole("admin")
def admin_metrics():
    users = load_users()
    logs = load_json_list(AUDIT_LOG_FILE)
    faq = load_faq_content()
    map_points = load_map_points()

    total_users = len(users)
    blocked_users = 0
    role_counts = {"student": 0, "curator": 0, "admin": 0}
    total_chat_messages = 0
    total_user_messages = 0
    total_bot_messages = 0
    today_prefix = datetime.now().date().isoformat()
    new_users_today = 0

    for user_id, user_data in users.items():
        role = get_user_role(user_data, user_id)
        role_counts[role] = role_counts.get(role, 0) + 1
        if is_user_blocked(user_data):
            blocked_users += 1
        created_at = str(user_data.get("created_at") or "")
        if created_at.startswith(today_prefix):
            new_users_today += 1
        history = sanitize_history(user_data.get("chat_history", []))
        total_chat_messages += len(history)
        total_user_messages += sum(1 for item in history if item.get("type") == "user")
        total_bot_messages += sum(1 for item in history if item.get("type") == "bot")

    metrics_payload = {
        "users_total": total_users,
        "users_blocked": blocked_users,
        "users_active": max(0, total_users - blocked_users),
        "users_new_today": new_users_today,
        "roles": role_counts,
        "faq_items": len(faq.get("items", [])),
        "map_halal_points": len(map_points.get("points", {}).get("halal", [])),
        "map_mosque_points": len(map_points.get("points", {}).get("mosque", [])),
        "audit_events_total": len(logs),
        "chat_messages_total": total_chat_messages,
        "chat_user_messages": total_user_messages,
        "chat_bot_messages": total_bot_messages
    }
    return jsonify({"success": True, "metrics": metrics_payload})


@app.route('/admin/moderation/messages', methods=['GET'])
@requireRole("admin")
def admin_moderation_messages():
    limit_raw = request.args.get("limit") or "120"
    try:
        limit = int(limit_raw)
    except ValueError:
        limit = 120
    rows = collect_user_messages(limit=limit)
    state = load_moderation_state()
    hidden_set = set(state.get("hidden_messages", []))
    for row in rows:
        row["hidden"] = row.get("key") in hidden_set
    return jsonify({"success": True, "items": rows})


@app.route('/admin/moderation/hide', methods=['POST'])
@requireRole("admin")
def admin_moderation_hide():
    data = request.json or {}
    lang = get_request_language()
    actor_user_id = (data.get("actor_user_id") or "").strip()
    message_key = str(data.get("message_key") or "").strip()
    hidden = bool(data.get("hidden"))
    if not message_key:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Не указан message_key", "message_key is required")}), 400

    state = load_moderation_state()
    hidden_set = set(state.get("hidden_messages", []))
    before_hidden = message_key in hidden_set
    if hidden:
        hidden_set.add(message_key)
    else:
        hidden_set.discard(message_key)
    payload = {
        "updated_at": datetime.now().isoformat(),
        "hidden_messages": sorted(hidden_set)
    }
    save_moderation_state(payload)
    append_audit_log(
        user_id=actor_user_id,
        action="moderation_visibility_changed",
        entity="moderation_message",
        before={"message_key": message_key, "hidden": before_hidden},
        after={"message_key": message_key, "hidden": hidden}
    )
    return jsonify({"success": True, "message_key": message_key, "hidden": hidden})


@app.route('/faq_content', methods=['GET'])
def get_faq_content():
    content = load_faq_content()
    return jsonify({"success": True, "content": content})


@app.route('/faq_content', methods=['POST'])
@requireRole("curator")
def save_faq_content_endpoint():
    data = request.json or {}
    lang = get_request_language()
    actor_user_id = (data.get("actor_user_id") or "").strip()
    items = data.get("items")
    if not isinstance(items, list):
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Некорректный формат FAQ", "Invalid FAQ payload")}), 400

    cleaned_items = []
    for item in items:
        if not isinstance(item, dict):
            continue
        question = str(item.get("question") or "").strip()
        answer = str(item.get("answer") or "").strip()
        if not question or not answer:
            continue
        cleaned_items.append({
            "question": question[:300],
            "answer": answer[:2000]
        })

    previous = load_faq_content()
    payload = {
        "updated_at": datetime.now().isoformat(),
        "items": cleaned_items
    }
    save_faq_content(payload)
    append_audit_log(
        user_id=actor_user_id,
        action="faq_content_updated",
        entity="faq_content",
        before={"items_count": len(previous.get("items", [])), "updated_at": previous.get("updated_at", "")},
        after={"items_count": len(cleaned_items), "updated_at": payload.get("updated_at", "")}
    )
    return jsonify({"success": True, "content": payload})


@app.route('/info_content', methods=['GET'])
def get_info_content():
    return jsonify({"success": True, "content": load_info_content()})


@app.route('/info_content', methods=['POST'])
@requireRole("curator")
def save_info_content_endpoint():
    data = request.json or {}
    lang = get_request_language()
    actor_user_id = (data.get("actor_user_id") or "").strip()
    language = normalize_language(data.get("language"))
    html_content = str(data.get("html") or "").strip()
    if not html_content:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Пустой контент", "Empty content")}), 400

    previous = load_info_content()
    content = previous.get("content", {"ru": "", "en": "", "ar": ""})
    content[language] = html_content[:80000]
    payload = {"updated_at": datetime.now().isoformat(), "content": content}
    save_info_content(payload)
    append_audit_log(
        user_id=actor_user_id,
        action="info_content_updated",
        entity="info_content",
        before={"language": language, "length": len(str(previous.get("content", {}).get(language) or ""))},
        after={"language": language, "length": len(content[language])}
    )
    return jsonify({"success": True, "content": payload})


@app.route('/map_points', methods=['GET'])
def get_map_points():
    return jsonify({"success": True, "content": load_map_points()})


@app.route('/map_points', methods=['POST'])
@requireRole("curator")
def save_map_points_endpoint():
    data = request.json or {}
    lang = get_request_language()
    actor_user_id = (data.get("actor_user_id") or "").strip()
    halal = _sanitize_map_points(data.get("halal", []))
    mosque = _sanitize_map_points(data.get("mosque", []))
    if not halal and not mosque:
        return jsonify({"success": False, "error": get_text_by_lang(lang, "Некорректные точки карт", "Invalid map points payload")}), 400

    previous = load_map_points()
    payload = {
        "updated_at": datetime.now().isoformat(),
        "points": {"halal": halal, "mosque": mosque}
    }
    save_map_points(payload)
    append_audit_log(
        user_id=actor_user_id,
        action="map_points_updated",
        entity="map_points",
        before={
            "halal_count": len(previous.get("points", {}).get("halal", [])),
            "mosque_count": len(previous.get("points", {}).get("mosque", []))
        },
        after={"halal_count": len(halal), "mosque_count": len(mosque)}
    )
    return jsonify({"success": True, "content": payload})


if __name__ == '__main__':
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    if not os.path.exists(AUDIT_LOG_FILE):
        save_json(AUDIT_LOG_FILE, [])
    if not os.path.exists(FAQ_FILE):
        save_faq_content({"updated_at": datetime.now().isoformat(), "items": []})
    if not os.path.exists(INFO_CONTENT_FILE):
        save_info_content({"updated_at": "", "content": {"ru": "", "en": "", "ar": ""}})
    if not os.path.exists(MAP_POINTS_FILE):
        save_map_points(_default_map_points_payload())
    if not os.path.exists(SYSTEM_SETTINGS_FILE):
        save_system_settings(_default_system_settings())
    if not os.path.exists(MODERATION_STATE_FILE):
        save_moderation_state(_default_moderation_state())
    
    print(f"Server starting...")
    print(f"Users file: {USERS_FILE}")
    print(f"Templates folder: {app.template_folder}")
    print(f"Static folder: {app.static_folder}")
    
    app.run(debug=True, port=5001, use_reloader=False) 
