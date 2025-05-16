#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if the environment variables are set
if [ -z "$PRIVATE_KEY" ]; then
  echo -e "${RED}Error: PRIVATE_KEY environment variable is not set${NC}"
  echo -e "Please set it by running: ${YELLOW}export PRIVATE_KEY=your_private_key_here${NC}"
  exit 1
fi

if [ -z "$INFURA_API_KEY" ]; then
  echo -e "${RED}Error: INFURA_API_KEY environment variable is not set${NC}"
  echo -e "Please set it by running: ${YELLOW}export INFURA_API_KEY=your_infura_api_key_here${NC}"
  exit 1
fi

# Build the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
docker build -t solidity-deployer .

# Run the container
echo -e "${GREEN}Running deployment container...${NC}"
docker compose up --build --detach

echo -e "${GREEN}Deployment process completed!${NC}"