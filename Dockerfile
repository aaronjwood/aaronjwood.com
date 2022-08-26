FROM pypy:3-slim-buster AS builder
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y nodejs
COPY static static
RUN cd static && npm i --production

FROM pypy:3-slim-buster
WORKDIR /srv/aaronjwood.com
COPY . .
COPY --from=builder /static/node_modules/ static/node_modules/
RUN pip install -r requirements.txt
ENV MODE RELEASE
STOPSIGNAL SIGINT
CMD ["pypy3", "main.py"]
