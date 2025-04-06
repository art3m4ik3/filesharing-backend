FROM node:22-alpine

WORKDIR /app

COPY yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
