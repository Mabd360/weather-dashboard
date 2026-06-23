# Use official Node.js runtime as parent image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Expose port 5000 (standard for our app, Back4app will bind to it)
EXPOSE 5000

# Start command
CMD ["node", "backend/server.js"]
