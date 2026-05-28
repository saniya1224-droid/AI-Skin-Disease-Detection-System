FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV and psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create upload directories
RUN mkdir -p uploads/heatmaps uploads/reports ml/saved_models

# Expose Flask port
EXPOSE 5000

# Run with gunicorn in production
CMD ["python", "run.py"]
