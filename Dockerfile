FROM pypy:3-slim-stretch

RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash -
RUN apt-get update && apt-get install -y npm

WORKDIR /srv/aaronjwood.com

COPY . .

RUN pip install -r requirements.txt
RUN cd static && npm i && cd -

ENV MODE RELEASE

STOPSIGNAL SIGINT

CMD ["pypy3", "main.py"]
