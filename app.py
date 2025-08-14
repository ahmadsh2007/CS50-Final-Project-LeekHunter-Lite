import os
import json
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# ! WARNING: Hard-coding your API key is a major security risk.
# * Anyone with access to this code will have your key.
# TODO Use environment variables for production or shared code.
API_KEY = "" 
genai.configure(api_key=API_KEY)

generation_config = {
    "temperature": 0.2,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 655366,
    "response_mime_type": "application/json", # Ensures the output is JSON
}

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config=generation_config
)

def build_prompt(code, lang):
    """Builds the prompt for the Gemini API."""
    return f"""
    You are an expert programmer and AI code reviewer specializing in {lang}.
    Your task is to perform a static analysis of the following code. Do NOT execute the code.

    Analyze the code for the following:
    1. Syntax errors, type errors, or potential runtime exceptions.
    2. Bad practices (e.g., unused variables, inefficient loops, security vulnerabilities like SQL injection).
    3. Logical errors or confusing logic.
    4. Memory management issues (especially for C).

    Return your findings as a JSON array of objects. Each object must have the following fields:
    - "line": The line number where the issue occurs (integer or null if general).
    - "severity": The severity of the issue ("error", "warning", or "info").
    - "message": A clear, concise description of the issue.
    - "suggestion": A concrete suggestion or code example on how to fix the issue.

    If the code is perfect and has no issues, return an empty JSON array [].

    Code to analyze:
    ```{lang}
    {code}
    ```
    """

@app.route('/')
def index():
    """Renders the main page."""
    return render_template('index.html')

'''
@app.route('/old')
def OLDindex():
    """Renders the main page."""
    return render_template('OLDindex.html')
'''

@app.route('/analyze', methods=['POST'])
def analyze_code():
    """Receives code and returns AI analysis."""
    data = request.get_json()
    if not data or 'code' not in data or 'lang' not in data:
        return jsonify({"error": "Missing code or language in request."}), 400

    code = data['code']
    lang = data['lang']

    if not code.strip():
        return jsonify([]), 200 # Return empty if no code is provided

    try:
        prompt = build_prompt(code, lang)
        response = model.generate_content(prompt)
        
        # The model is configured to return JSON, so we can directly use response.text
        # and load it as JSON.
        issues = json.loads(response.text)
        return jsonify(issues)

    except Exception as e:
        print(f"An error occurred: {e}")
        # Return a user-friendly error in the expected format
        error_issue = [{
            "line": None,
            "severity": "error",
            "message": "Failed to analyze code. The AI model may be temporarily unavailable or the response was invalid.",
            "suggestion": f"Please check your API key and try again later. Error details: {str(e)}"
        }]
        return jsonify(error_issue), 500

if __name__ == '__main__':
    app.run(debug=True)