FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY ml/ ml/

EXPOSE 8500

ENV PORT=8500
ENV LOG_LEVEL=INFO
ENV PYTHONPATH=/app

CMD ["uvicorn", "ml.main:app", "--host", "0.0.0.0", "--port", "8500"]
