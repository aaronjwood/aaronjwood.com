FROM python:3-alpine

COPY . /srv/aaronjwood

RUN apk update && apk add build-base nodejs
RUN pip install -r /srv/aaronjwood/requirements.txt
RUN cd /srv/aaronjwood && npm install && mv node_modules static
RUN apk del build-base nodejs

ENV MODE RELEASE

ENTRYPOINT python /srv/aaronjwood/server.py
