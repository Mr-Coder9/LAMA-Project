FROM python:3.10

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 6001

RUN apt-get update && apt-get install -y docker.io
RUN apt-get update && apt-get install -y docker-compose


CMD ["python", "flask_backend.py", "--host=0.0.0.0", "--port=6001"]

