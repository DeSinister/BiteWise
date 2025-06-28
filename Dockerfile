FROM python:3.11-slim

# Install Java 17 instead of Java 11 (pyzxing works fine with it)
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless && \
    pip install --upgrade pip && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy your app
COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set env vars
ENV FLASK_ENV=development
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# Expose the port Flask runs on
EXPOSE 5000

# Run Flask in debug mode
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
