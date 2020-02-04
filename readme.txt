node.js chat

IV. Run in Docker
You will need own domain name. Make sure that you domain linked with host IP address where you are running chat application.
Install Docker, docker-compose if not yet installed (chmod a+x install-docker.sh && ./install-docker.sh)
sudo docker-compose build
Get SSL certificates: ./init-letsencrypt.sh (make sure that line `domains=(chat2.kuzovkov12.ru)` contains actual domain name)
Check that actual domain name is in docker/nginx/conf.d/default.conf
Check that actual domain name is in docker/coturn/turnserver.conf
sudo docker-compose up -d





