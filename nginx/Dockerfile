# Base on offical NGINX Alpine image
FROM nginx:alpine

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./default.conf /etc/nginx/conf.d/default.conf

COPY certs/fullchain.pem /etc/nginx/certs/fullchain.pem
COPY certs/privkey.pem /etc/nginx/certs/privkey.pem
# Expose the listening port
EXPOSE 80
EXPOSE 8443

# # Launch NGINX
CMD [ "nginx", "-g", "daemon off;" ]