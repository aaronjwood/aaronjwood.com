FROM python:3-slim AS builder
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y nodejs
COPY static static
RUN cd static && npm i --production

FROM python:3-slim
WORKDIR /srv/aaronjwood.com
COPY . .
COPY --from=builder /static/node_modules/ static/node_modules/
RUN pip install -r requirements.txt
CMD ["fastapi", "run", "server.py"]
