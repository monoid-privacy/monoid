FROM python:3.8-slim-buster
WORKDIR /app
COPY . monoid
WORKDIR /app/monoid/monoid-integrations/monoid-postgres
RUN pip3 install -r requirements.txt
RUN pip3 install -r snowflake_requirements.txt
ENTRYPOINT [ "python", "main.py" ]
