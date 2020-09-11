/*начальная инициализация клиентского приложения*/
window.onload = function(){
    if (!Date.now) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }
    A.init();
};
