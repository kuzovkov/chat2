/*клиентский модуль обработчиков событий при взаимодействии клиента и сервера*/

var Socket = {};

Socket.url = null;
Socket.pathname = null;
Socket.socket = null;
Socket.hostname = null;
Socket.app = null;

/**
 * инициализация модуля
 * @param app объект приложения
 **/
Socket.init = function(app){
    Socket.app = app;
    Socket.url = window.location.host;
    Socket.pathname = window.location.pathname;
    Socket.socket = Socket.app.io.connect(Socket.url+Socket.pathname);
    Socket.hostname = window.location.hostname;
};

/**
 * установка обработчиков событий
 * @param event строка с названием события
 * @param handler функция-обработчик события
 **/
Socket.setEventHandler = function(event, handler){ /*установка обработчиков*/
    Socket.socket.on(event, handler);
};

/**
 * отправка событий
 * @param event строка с названием события
 * @param object объект, содержащий посылаемые данные
 **/
Socket.send = function(event, object){
    //console.log(event+':'+object);
    Socket.socket.emit(event, object);
};

