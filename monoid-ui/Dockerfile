FROM node:16-alpine

COPY . /app
WORKDIR /app

RUN yarn install
RUN yarn run build

ENV NODE_ENV production
EXPOSE 3000

CMD [ "npx", "serve", "build" ]