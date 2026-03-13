import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from db import lookup_location
from uv_logic import fetch_uv, uv_category

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route("/api/uv")
def get_uv():
    q = request.args.get("q", "").strip()

    if not q:
        return jsonify({"error": "Please provide a suburb or postcode."}), 400

    location = lookup_location(q)

    if location is None:
        return jsonify({"error": "Location not found. Please try a different suburb or postcode."}), 404

    try:
        uv_index = fetch_uv(location["lat"], location["lon"])
    except RuntimeError:
        return jsonify({"error": "UV data is currently unavailable. Please try again later."}), 503
    except ValueError:
        return jsonify({"error": "Server configuration error."}), 500

    return jsonify({
        "uv_index": round(uv_index, 1),
        "uv_category": uv_category(uv_index),
        "location": f"{location['suburb']}, {location['state']} {location['postcode']}",
    })


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
