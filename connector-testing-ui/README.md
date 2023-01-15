# Connector Testing UI

This is a simple webapp for testing connector Docker containers. To use it, build you connector Docker image and enter the name at the top of the page, as well as each of the JSON's required for the various Docker commands. 

Build the client with ` cd client && yarn run build `

Then run the server with ` cd server && python app.py `

The server uses file storage: `secrets/` for the config files and `tmp/output.log` to store the output. 
