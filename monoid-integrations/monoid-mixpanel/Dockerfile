FROM python:3.8-slim-buster
WORKDIR /app
COPY . monoid
WORKDIR /app/monoid/monoid-integrations/monoid-mixpanel
RUN pip3 install -r requirements.txt
ENTRYPOINT [ "python", "main.py" ]
