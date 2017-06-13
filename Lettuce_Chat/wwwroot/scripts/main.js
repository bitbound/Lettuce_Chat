var dgi = document.getElementById;
var dgc = document.getElementsByClassName;
var dgt = document.getElementsByTagName;
var Lettuce;
(function (Lettuce) {
    function Init() {
        if (Lettuce.Socket != undefined && Lettuce.Socket.readyState != WebSocket.CLOSED) {
            throw "WebSocket already exists and is not closed.";
        }
        Lettuce.Socket = new WebSocket(location.origin.replace("http", "ws") + "/Socket");
        SetHandlers();
    }
    Lettuce.Init = Init;
    function SetHandlers() {
        Lettuce.Socket.onopen = function (e) {
        };
        Lettuce.Socket.onclose = function (e) {
        };
        Lettuce.Socket.onerror = function (e) {
        };
        Lettuce.Socket.onmessage = function (e) {
            Lettuce.HandleMessage(JSON.parse(e.data));
        };
    }
    Lettuce.SetHandlers = SetHandlers;
    function HandleMessage(JsonMessage) {
    }
    Lettuce.HandleMessage = HandleMessage;
})(Lettuce || (Lettuce = {}));
window.onload = function () {
    Lettuce.Init();
};
//# sourceMappingURL=main.js.map