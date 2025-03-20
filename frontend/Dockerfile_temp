FROM node:20-alpine as build



WORKDIR /app
COPY my-app/package*.json ./
RUN npm install
COPY my-app/ .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
