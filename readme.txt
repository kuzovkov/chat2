node.js chat

I. Setup. (Example)
Requires: Ubuntu (tested on 14.04), Node.js

cd /var/www/vhosts
sudo git clone https://github.com/kuzovkov/chat1.git
cd chat1
sudo npm install
sudo chmod a+x server.js
sudo chmod a+x start
sudo chmod a+x stop

sudo cp init.d.chat1.example /etc/init.d/chat1
sudo chmod a+x /etc/init.d/chat1
sudo update-rc.d chat1 start 99 2 3 4 5 . stop 01 0 1 6 .
sudo echo 'user.info       /var/log/chat.log' > /etc/rsyslog.d/chat.conf
sudo service rsyslog restart


II. Running
sudo service chat1 start

Reading log: tail -f /var/log/chat

III. Stopping, Restarting
sudo service chat1 stop
sudo service chat1 restart



