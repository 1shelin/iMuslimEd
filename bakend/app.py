from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__, template_folder='../templates', static_folder='../static')

# Токен от Яндекс Cloud
YANDEX_API_KEY = "y0_AgAAAABZ4HnLAAAAAXXXXXXXXXXXXXXXX"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask():
    user_message = request.json.get('message')

    # Настройки API ЯндексGPT
    url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
    headers = {
        "Authorization": f"Api-Key {YANDEX_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "modelUri": "gpt://b1gXXXXXXXXXXXXXXX/yandexgpt/latest",
        "completionOptions": {
            "stream": False,
            "temperature": 0.6,
            "maxTokens": 300
        },
        "messages": [
            {"role": "system", "text": "Ты — ассистент iMuslimEd. Отвечай уважительно и корректно, в рамках исламских ценностей."},
            {"role": "user", "text": user_message}
        ]
    }

    response = requests.post(url, headers=headers, json=data)
    reply = response.json()["result"]["alternatives"][0]["message"]["text"]

    return jsonify({"reply": reply})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
