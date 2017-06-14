var Lettuce;
(function (Lettuce) {
    Lettuce.Me = new Lettuce.Models.Me();
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
            var queryString = location.search.replace("?", "");
            var query = queryString.split("=");
            if (query.length == 2 && query[0] == "chat") {
                Lettuce.Messages.JoinChat(query[1]);
            }
            else {
                if (Lettuce.Me.Username && Lettuce.Me.AuthenticationToken) {
                    Lettuce.Messages.TryResumeLogin();
                }
            }
        };
        Lettuce.Socket.onclose = function (e) {
        };
        Lettuce.Socket.onerror = function (e) {
        };
        Lettuce.Socket.onmessage = function (e) {
            var message = JSON.parse(e.data);
            Lettuce.Messages.HandleMessage(message);
        };
    }
    Lettuce.SetHandlers = SetHandlers;
})(Lettuce || (Lettuce = {}));
window.onload = function () {
    Lettuce.Init();
};
//# sourceMappingURL=main.js.map