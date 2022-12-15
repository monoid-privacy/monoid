FROM node:16-alpine

COPY . /app
WORKDIR /app

RUN yarn install
RUN yarn run build

FROM nginx:1.23-alpine

COPY --from=0 /app/build /usr/share/nginx/html
COPY --from=0 /app/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
