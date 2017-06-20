var Lettuce;
(function (Lettuce) {
    Lettuce.LogoutExpected = false;
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
            if (!Lettuce.LogoutExpected) {
                Lettuce.Utilities.ShowDialog("Connection Closed", "Your connection has been closed.  Click OK to reconnect.", function () { location.reload(); });
            }
            Lettuce.LogoutExpected = false;
        };
        Lettuce.Socket.onerror = function (e) {
            if (!Lettuce.LogoutExpected) {
                Lettuce.Utilities.ShowDialog("Connection Closed", "Your connection has been closed.  Click OK to reconnect.", function () { location.reload(); });
            }
            Lettuce.LogoutExpected = false;
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