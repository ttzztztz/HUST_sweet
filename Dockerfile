FROM node:alpine

WORKDIR /var/sweet

COPY package.json .
COPY yarn.lock .
RUN yarn

COPY . .
RUN yarn run compile
RUN yarn run init

CMD [ "start" ]
ENTRYPOINT [ "yarn" ]