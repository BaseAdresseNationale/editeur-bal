# Base image
FROM node:18

# Create app directory
WORKDIR /app

# Copy the package.json and yarn.lock files to the working directory
COPY package.json yarn.lock ./

# Install app dependencies
RUN yarn install

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN yarn build

ENV PORT=3000
ENV NODE_ENV=production

# Start the server using the production build
CMD [ "yarn", "start" ]
