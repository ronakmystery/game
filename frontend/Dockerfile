FROM node:20

WORKDIR /app

# install dependencies
COPY package.json ./
RUN npm install

# copy source
COPY . .

# expose vite dev server port
EXPOSE 5175

# start vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5175"]