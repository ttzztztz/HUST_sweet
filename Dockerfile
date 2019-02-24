FROM node:alpine

WORKDIR /var/sweet

COPY package.json .
COPY yarn.lock .
RUN yarn

COPY . .
RUN yarn compile

CMD [ "start" ]
ENTRYPOINT [ "yarn" ]