FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
# Set Django settings module environment variable
ENV DJANGO_SETTINGS_MODULE=webImage.settings
WORKDIR /app

# Cài git + các thư viện hệ thống cần thiết
RUN apt-get update && \
    apt-get install -y git build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN python -c "import clip; clip.load('ViT-B/32')"

COPY . .
EXPOSE 8000
# Replace gunicorn with daphne for ASGI support
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "webImage.asgi:application"]
