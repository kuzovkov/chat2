FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install --global gulp-cli
COPY . .
EXPOSE 8000

CMD [ "node", "server_http.js", "8000" ]
