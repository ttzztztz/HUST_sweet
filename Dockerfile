FROM node:alpine

WORKDIR /var/sweet

COPY package.json .
COPY yarn.lock .
RUN yarn

COPY . .
RUN yarn run compile

CMD [ "start" ]
ENTRYPOINT [ "yarn" ]