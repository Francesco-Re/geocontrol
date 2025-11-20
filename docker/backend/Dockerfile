FROM node:20-alpine


WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

RUN ls -l 
RUN ls -l /app/scripts
RUN apk add --no-cache dos2unix && dos2unix scripts/wait-for-db.sh
RUN chmod +x scripts/wait-for-db.sh

EXPOSE 5000

CMD ["/bin/sh", "-c", "/app/scripts/wait-for-db.sh && npm run create-root && npm start"]
