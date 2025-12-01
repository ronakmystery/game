FROM python:3.11

WORKDIR /app
RUN pip install fastapi uvicorn[standard] docker jinja2 pymysql bcrypt

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
