namespace Lettuce {
    export var Socket: WebSocket;
    export var Me = new Lettuce.Models.Me();
    export function Init() {
        if (Socket != undefined && Socket.readyState != WebSocket.CLOSED) {
            throw "WebSocket already exists and is not closed.";
        }
        Socket = new WebSocket(location.origin.replace("http", "ws") + "/Socket");
        SetHandlers();
    }
    export function SetHandlers() {
        Socket.onopen = function (e) {
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
        Socket.onclose = function (e) {
            Lettuce.Utilities.ShowDialog("Connection Closed", "Your connection has been closed.  Click OK to reconnect.", function () { location.reload() });
        };
        Socket.onerror = function (e) {
            Lettuce.Utilities.ShowDialog("Connection Closed", "Your connection has been closed.  Click OK to reconnect.", function () { location.reload() });
        };
        Socket.onmessage = function (e) {
            var message = JSON.parse(e.data);
            Lettuce.Messages.HandleMessage(message);
        };
    }
}

window.onload = function () {
    Lettuce.Init();
}