# BiteWise: Flask Dietary Assistant

A web-based dietary assistant that analyzes food products based on barcodes or uploaded images. It provides nutritional, health, and environmental scores, along with warnings based on the user's dietary profile.

---

## Project Structure

.
├── app.py # Main Flask application
├── requirements.txt # Python dependencies
├── Dockerfile # Docker setup
├── static # Static assets
│ ├── script.js
│ └── style.css
├── templates # HTML templates
│ ├── base.html
│ ├── index.html
│ ├── result.html
│ └── upload.html

---

## Features

- Upload a food image or input a barcode manually.
- Fetch product information from an external database.
- Analyze the product against the user's dietary profile.
- Return structured JSON insights from an LLM, including:
  - Nutrition score and reasoning
  - Health score and reasoning
  - Environmental score and reasoning
  - Warnings and storage instructions

---

## Prerequisites

- Docker installed on your machine.
- (Optional) Python 3.11 environment if running locally without Docker.

---

## Running with Docker


1. **Build the Docker image:**

```bash
docker build -t dietary-assistant
```
2. **Run the container:**
```bash
docker run -p 5000:5000 dietary-assistant
```
3. **Open the app in your browser:**

```
http://localhost:5000
```

## Running Locally Without Docker

1. **Create a virtual environment:**

```   
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```
pip install -r requirements.txt
```

3. **Set environment variables (Linux/macOS):**
```
export FLASK_APP=app.py
export FLASK_ENV=development
```

** On Windows (PowerShell):**
```
set FLASK_APP=app.py
set FLASK_ENV=development
```

4. **Run the Flask app:**
```
flask run --host=0.0.0.0 --port=5000
```

5. **Access the app in your browser:**
```
http://localhost:5000
```



Notes
Java 17 is required to run pyzxing for barcode reading.
Uploaded images are validated and temporarily stored in the container.
If the LLM fails to provide insights, fallback scores and messages will be displayed.

