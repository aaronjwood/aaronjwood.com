FROM python:3-alpine

COPY . /srv/aaronjwood.com

RUN apk update && apk add build-base nodejs && \
    pip install -r /srv/aaronjwood.com/requirements.txt && \
    cd /srv/aaronjwood.com/static && npm install && \
    apk del build-base nodejs

ENV MODE RELEASE

ENTRYPOINT python /srv/aaronjwood.com/main.py
