# Use Node.js as base image
FROM node:22.14.0-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git python3 make g++

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install -g npm@11.4.0


# Copy project files
COPY . .

# Create a .env file from environment variables at runtime

# Set the entrypoint script
# Default command to run when the container starts
CMD ["sh", "-c", "npx hardhat node & sleep 3 && npx hardhat run scripts/deploy.js --network localhost && tail -f /dev/null"]