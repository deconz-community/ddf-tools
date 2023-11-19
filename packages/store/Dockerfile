# Use the official Directus image as the base image
FROM directus/directus

# Copy the local project files to the container
COPY . /var/directus

# Set the working directory in the container to /var/directus
WORKDIR /var/directus

# Expose the port Directus is running on
EXPOSE 8055

# Start Directus
CMD ["npx", "directus", "start"]
