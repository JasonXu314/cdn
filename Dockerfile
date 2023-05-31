FROM node:18

WORKDIR /app

COPY package.json .

RUN yarn install

COPY src src
COPY tsconfig.json .
COPY tsconfig.build.json .
COPY nest-cli.json .

ENV PORT=8081

RUN yarn build

EXPOSE 8081

CMD ["yarn", "start:prod"]