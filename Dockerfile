FROM node:18

WORKDIR /app

COPY package.json .

RUN yarn install

COPY src .

ENV PORT=8081

RUN yarn build

EXPOSE 8081

CMD ["yarn", "start:prod"]