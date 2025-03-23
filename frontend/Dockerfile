# 1. For build React app
FROM node:lts
# Set working directory
WORKDIR /app
#
COPY my-app/*.json /app/
# Same as npm install
RUN npm ci --legacy-peer-deps
COPY my-app /app
ENV CI=true
ENV PORT=3000

CMD [ "npm", "start" ]

EXPOSE 3000
