FROM node:17-slim
WORKDIR /usr/app

RUN npm install -g serve

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Set the environment variable for the application's port
ENV PORT 3000

# Build the React app
RUN npm run build

# Serve the 'build' directory on port 4200 using 'serve'
CMD ["serve", "-s", "-l", "3000", "./build"]
