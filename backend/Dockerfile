FROM node:20 as base

RUN apt-get update && apt-get install -y curl

RUN curl -o /usr/local/bin/wait-for-it https://raw.githubusercontent.com/vishnubob/wait-for-it/refs/heads/master/wait-for-it.sh \
    && chmod +x /usr/local/bin/wait-for-it

CMD mkdir - p /app/backend/src

WORKDIR /app/backend/src

COPY src/package.json .

RUN npm i

COPY src/ .

FROM base as production

ENV NODE_PATH=./build

# RUN npm install

CMD ["/bin/sh", "-c", "wait-for-it database:5432 -- npm start"]