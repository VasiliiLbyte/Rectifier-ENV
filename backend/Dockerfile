FROM python:3.11-slim

WORKDIR /app

# Сначала копируем зависимости — Docker кешируют этот слой
# Если код изменился, но requirements.txt нет — пакеты не переустанавливаются
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
