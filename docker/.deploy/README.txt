Настройка деплоя проекта на Gitlab
===================================
Предустановки:
----------------
- prod сервер ubuntu 18
- user "ubuntu" с sudo, доступ по ssh
- склонирован репозиторий проекта в каталог /home/ubuntu/chat

Клонируем проект на сервер

В настройках репозитория:
------------------------
https://gitlab.com/doublesystems/p2p/-/settings/ci_cd

Settings->CI/CD->Variables

Устанавливаем переменные:
-----------------------------
SERVER_HOST  ubuntu@207.180.231.228

SSH_PRIVATE_KEY   <base64 encoded private ssh key for ubuntu@78.159.100.243>  порядок его создания:

						ssh-keygen -f ~/.ssh/ds-gitlab создаем ключи
						ssh-copy-id -f -i ~/.ssh/ds-gitlab ubuntu@207.180.231.228 копируем на сервер
						echo "$(cat ./.ssh/ds-gitlab | base64 -w0)"  получаем кодированный ключ

Настраиваем доступ к репозиторию с сервера (207.180.231.228)
-----------------------------------------------------------------
ssh ubuntu@207.180.231.228
создаваем пару ключей:
------------------------
ssh-keygen -o -t rsa -b 4096 -C "email@example.com" -f ~/.ssh/gitlab.rsa

Копируем публичный ключ ~/.ssh/gitlab.rsa.pub и вставляем в настройках своего аккаунта Gitlab
Кликаем на аватарке Settings -> SSH keys. Вставляем публичный ключ в форме, жмем кнопку "Add key".

Проверка:
------------
eval $(ssh-agent -s)
ssh-add ~/.ssh/gitlab.rsa
ssh -T -o 'IdentitiesOnly yes' -i ~/.ssh/gitlab.rsa git@gitlab.com

Должны получить сообщение типа "Welcome to GitLab, @username!"

Меняем url репозитория:
----------------------------
cd /home/ubuntu/chat
git remote set-url origin git@gitlab.com:doublesystems/p2p.git

Прописываем в ssh конфиге:
nano ~/.ssh/config

пишем туда:
------------
Host gitlab.com
  Preferredauthentications publickey
  IdentityFile ~/.ssh/gitlab.rsa
  IdentitiesOnly yes
------------------------------------

В корне проекта создаем файл ".gitlab-ci.yml":
--------------------------------------------------
#include:
#  - remote: 'https://gitlab.com/gitlab-org/auto-devops-v12-10/-/raw/master/Auto-DevOps-remote.gitlab-ci.yml'

image: "ubuntu:bionic"

before_script:
    - apt-get update
    - apt-get install zip unzip
    - 'which ssh-agent || ( apt-get update -y && apt-get install openssh-client -y )'
    - mkdir -p ~/.ssh
    - eval $(ssh-agent -s)
    - '[[ -f /.dockerenv ]] && echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config'

dev_deploy:
  rules:
    - if: $CI_COMMIT_BRANCH == 'dev'
  #only:
  #  - dev
  script:
    - echo "${DEV_PRIVATE_KEY}" | tr -d ' ' | base64 --decode | ssh-add -
    - ssh $DEV_HOST 'hostname && whoami && cd /home/ubuntu/chat/.deploy/ && ./worker.sh deploy dev'


-----------------------------------------------------------------------------------------------------------------------

При мерже/коммите в ветку указанную в секции "rules" происходит запуск runner Gitlab
(контейнер на базе образа указанного в секции "image") в который клонируется репозиторий и 
далее выполняются команды из секций "before_script" и нижеследующих секция, которые называются "jobs" и
название которых произвольно, за исключением ряда ключевых слов.

К вышеприведеннном скрипте устанавливается ssh-agent, подключается приватный ключ для
дев. сервера и выполняется скрипт на прод. сервере, который делает git pull из указанной
ветки, собирает образы, пушит его в docker registry и запускает деплой.
---------------------------------------------------------------------------
