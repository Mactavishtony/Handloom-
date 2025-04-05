#!/bin/bash

# Load environment variables from .env file
export $(cat .env | xargs)

# Run the import script
node src/scripts/importPatterns.js