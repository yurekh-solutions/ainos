from flask import Flask, jsonify, Response, make_response, request
import requests
import uuid
import base64

from asgiref.wsgi import WsgiToAsgi

app = Flask(__name__)
asgi_app = WsgiToAsgi(app)

gstSessions = {}

# Keep-alive pings this lightweight endpoint instead of /getCaptcha so the
# Render service stays warm WITHOUT hammering the GSTN portal every 5 minutes
# (which gets our cloud IP throttled and causes 502s on real requests).
@app.route("/api/v1/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/v1/getCaptcha", methods=["GET"])
def getCaptcha():
    try:
        captcha = "https://services.gst.gov.in/services/captcha"
        session = requests.Session()
        id = str(uuid.uuid4())

        # Explicit timeouts so a slow GSTN portal fails fast (and can be retried)
        # instead of hanging past Render's ~55s gateway, which returns a 502.
        response = session.get(
            "https://services.gst.gov.in/services/searchtp",
            timeout=20,
        )

        captchaResponse = session.get(captcha, timeout=20)
        captchaBase64 = base64.b64encode(captchaResponse.content).decode("utf-8")

        # For Testing Purpose only

        # imageString = f'<img src="data:image/png;base64,{captchaBase64}" alt="captcha">'
        # with open('captcha.html','w') as f:
        #     f.write(imageString)   
        #     f.close()

        #

        gstSessions[id] = {
            "session": session
        }

        json_response = {
            "sessionId": id,
            "image": "data:image/png;base64," + captchaBase64,
        }

        return jsonify(json_response)
    
    except Exception as e:
        print(e)
        # Return a real 5xx so the caller's retry logic can detect the failure
        # (previously it returned HTTP 200 with an error body, which the caller
        # treated as success and rendered a broken/empty captcha).
        return jsonify({"error": "Error in fetching captcha"}), 502
    

@app.route("/api/v1/getGSTDetails", methods=["POST"])
def getGSTDetails():
    try:
        sessionId = request.json.get("sessionId")
        GSTIN = request.json.get("GSTIN")
        captcha = request.json.get("captcha")

        user = gstSessions.get(sessionId)

        session = user['session']
        if session is None:
            return jsonify({"error": "Invalid session id"})

        gstData = {
            "gstin": GSTIN,
            "captcha": captcha,
        }

        response = session.post(
            "https://services.gst.gov.in/services/api/search/taxpayerDetails",
            json=gstData,
            timeout=25,
        )

        return jsonify(response.json())
    
    except Exception as e:
        print(e)
        return jsonify({"error": "Error in fetching GST Details"}), 502


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get('PORT', 5001))
    uvicorn.run(asgi_app, host='0.0.0.0', port=port)
