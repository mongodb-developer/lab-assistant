FROM node:17-slim
WORKDIR /usr/app

# Install dependencies.
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Run the web service on container startup.
CMD ["node", "server/server.js"]
