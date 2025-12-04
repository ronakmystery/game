FROM python:3.11-slim

WORKDIR /app

COPY . .

COPY requirements.txt .
RUN pip install -r requirements.txt

EXPOSE 8001

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
