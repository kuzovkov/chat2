#!/usr/bin/env bash

BRANCH=$2
echo "$BRANCH"
if [[ "$BRANCH" == "" ]]; then
    echo "The second parameter must be branch"
    exit 1
fi
SERVER_HOST=ubuntu@207.180.231.228

echo branch="$BRANCH"
root_dir="$( cd "$( dirname "$0" )" && pwd )/.."
deploy_dir="$( cd "$( dirname "$0" )" && pwd )"
cd $root_dir
git add .
git commit -m before_pull
git checkout $BRANCH
git pull origin $BRANCH
cd $deploy_dir

#printenv

run_deploy(){
    ssh $SERVER_HOST sh -c "hostname && whoami && cd /home/ubuntu/chat/ && docker-compose stop && docker-compose build && docker-compose up -d"
}

case "$1" in
  deploy)
    run_deploy
    esac


