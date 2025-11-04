FROM python:3.11-slim

# Install Java 21 (pyzxing works fine with it)
RUN apt-get update && \
    apt-get install -y openjdk-21-jre-headless && \
    pip install --upgrade pip && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy your app
COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set env vars
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Expose the port Flask runs on
EXPOSE 5000

# Run with Gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app:app"]
