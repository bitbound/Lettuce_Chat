namespace Lettuce {
    export var LogoutExpected = false;
    export var Socket: WebSocket;
    export var Me = new Lettuce.Models.Me();
    export var IsFocused = true;
    export var UnreadMessageCount = 0;
    export var UnreadMessageInterval = -1;
    export function Init() {
        if (Socket != undefined && Socket.readyState != WebSocket.CLOSED) {
            throw "WebSocket already exists and is not closed.";
        }
        Socket = new WebSocket(location.origin.replace("http", "ws") + "/Socket");
        window.onblur = function () {
            Lettuce.IsFocused = false;
        }
        window.onfocus = function () {
            Lettuce.IsFocused = true;
            Lettuce.UnreadMessageCount = 0;
            document.title = "Lettuce Chat";
        }
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
            if (!LogoutExpected) {
                Lettuce.Utilities.ShowDialog("Connection Closed", "Your connection has been closed.  Click OK to reconnect.", function () { location.reload() });
            }
            LogoutExpected = false;
        };
        Socket.onerror = function (e) {
            if (!LogoutExpected) {
                Lettuce.Utilities.ShowDialog("Connection Closed", "Your connection has been closed.  Click OK to reconnect.", function () { location.reload() });
            }
            LogoutExpected = false;
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