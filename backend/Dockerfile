FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
