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

# Copy everything except media files
COPY . .

# Create necessary directories
RUN mkdir -p /app/mediafiles/clip_index

# Here we copy the pre-built index files from local to the container
# Make sure these files exist in your local ./mediafiles/clip_index/ directory
COPY mediafiles/clip_index/ /app/mediafiles/clip_index/

EXPOSE 8000

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "webImage.asgi:application"]
