FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
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
CMD ["gunicorn", "webImage.wsgi:application", "--bind", "0.0.0.0:8000", "--timeout", "300"]
