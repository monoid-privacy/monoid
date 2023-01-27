FROM python:3.8-slim-buster
WORKDIR /app
COPY . .
RUN pip3 install --upgrade pip
RUN pip3 install packaging
RUN apt-get update; apt-get install -y libmariadb-dev gcc
RUN pip3 install -r requirements.txt
ENTRYPOINT [ "python", "main.py" ]
