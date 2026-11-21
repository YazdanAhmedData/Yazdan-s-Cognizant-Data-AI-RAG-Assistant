
from flask import Flask, render_template, request, jsonify
import subprocess
import sys
import os

app = Flask(__name__)

PROJECT_FOLDER = os.path.dirname(os.path.abspath(__file__))


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/ask", methods=["POST"])
def ask():

    data = request.get_json()
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Please enter a question."}), 400

    try:
        # Run your existing RAG pipeline without modifying it
        result = subprocess.run(
            [sys.executable, "process_incoming.py"],
            input=question + "\n",
            capture_output=True,
            text=True,
            cwd=PROJECT_FOLDER,
            timeout=600
        )

        if result.returncode != 0:
            return jsonify({
                "error": result.stderr or "RAG pipeline failed."
            }), 500

        response_path = os.path.join(
            PROJECT_FOLDER, "response.txt"
        )

        with open(response_path, "r", encoding="utf-8") as f:
            answer = f.read()

        return jsonify({
            "answer": answer,
            "status": "success"
        })

    except subprocess.TimeoutExpired:
        return jsonify({
            "error": "The AI took too long to respond."
        }), 504

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
