FROM node:18-alpine
WORKDIR /app

# Install dependencies using npm
COPY package.json package-lock.json ./
RUN npm install

# Copy source and start
COPY . .
EXPOSE 3000
# Use dev mode; change to "npm run dev" for development, or "npm run start" for production
CMD ["npm", "run", "dev"]