var Lettuce;
(function (Lettuce) {
    var Messages;
    (function (Messages) {
        function GetGuestChat() {
            var request = {
                "Type": "GetGuestChat"
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.GetGuestChat = GetGuestChat;
        function TryResumeLogin() {
            var request = {
                "Type": "TryResumeLogin",
                "Username": Lettuce.Me.Username,
                "AuthenticationToken": Lettuce.Me.AuthenticationToken
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.TryResumeLogin = TryResumeLogin;
        function JoinChat(ChatID) {
            var request = {
                "Type": "JoinChat",
                "DisplayName": Lettuce.Me.DisplayName,
                "Username": Lettuce.Me.Username,
                "AuthenticationToken": Lettuce.Me.AuthenticationToken
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.JoinChat = JoinChat;
        function ChangeChat(ChatID) {
            var request = {
                "Type": "ChangeChat",
                "ChatID": ChatID
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.ChangeChat = ChangeChat;
        function NewChat() {
            var request = {
                "Type": "NewChat"
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.NewChat = NewChat;
        function GetCurrentUsers() {
            var request = {
                "Type": "GetCurrentUsers"
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.GetCurrentUsers = GetCurrentUsers;
        function HandleMessage(JsonMessage) {
            switch (JsonMessage.Type) {
                case "GetGuestChat":
                    if (JsonMessage.Status == "ok") {
                        Lettuce.Me.Username = JsonMessage.User.Username;
                        Lettuce.Me.DisplayName = JsonMessage.User.DisplayName;
                        Lettuce.Me.AuthenticationToken = JsonMessage.User.AuthenticationTokens[0];
                        Lettuce.Default.AddChat(JsonMessage.Chat);
                        document.getElementById("chat-" + JsonMessage.Chat.ChatID).classList.add("selected");
                        Lettuce.Utilities.FadeOut(document.getElementById("divLogin"));
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"));
                        document.getElementById("divUserList").innerHTML = Lettuce.Me.DisplayName + " (you)";
                    }
                    break;
                case "TryResumeLogin":
                    if (JsonMessage.Status == "not found") {
                        Lettuce.Me.AuthenticationToken = "";
                        Lettuce.Me.DisplayName = "";
                        Lettuce.Me.Username = "";
                    }
                    else if (JsonMessage.Status == "locked") {
                        Lettuce.Utilities.ShowDialog("Account Locked", "Your account is temporarily locked due to bad login attempts.  Try logging in again later.");
                    }
                    else if (JsonMessage.Status == "ok") {
                        Lettuce.Me.DisplayName = JsonMessage.User.DisplayName;
                        for (var i = 0; i < JsonMessage.Chats.length; i++) {
                            Lettuce.Default.AddChat(JsonMessage.Chats[i]);
                        }
                        Lettuce.Messages.ChangeChat(JsonMessage.Chats[0].ChatID);
                        document.getElementById("chat-" + JsonMessage.Chats[0].ChatID).classList.add("selected");
                        Lettuce.Messages.GetCurrentUsers();
                        Lettuce.Utilities.FadeOut(document.getElementById("divLogin"));
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"));
                    }
                    break;
                case "ChangeChat":
                    if (JsonMessage.Status == "not found") {
                        Lettuce.Utilities.ShowDialog("Chat Not Found", "The selected chat wasn't found.  Try reloading the page.");
                    }
                    else if (JsonMessage.Status == "unauthorized") {
                        Lettuce.Utilities.ShowDialog("Access Denied", "You are not authorized to access this chat.");
                    }
                    else if (JsonMessage.Status == "ok") {
                        var labels = document.getElementsByClassName("chat-label");
                        for (var i = 0; i < labels.length; i++) {
                            labels[i].classList.remove("selected");
                        }
                        Lettuce.Messages.GetCurrentUsers();
                        document.getElementById("chat-" + JsonMessage.ChatID).classList.add("selected");
                        if (document.getElementById("divMainMenu").classList.contains("menu-open")) {
                            Lettuce.Default.ToggleMainMenu();
                        }
                        Lettuce.Utilities.ShowTooltip("Changed to " + JsonMessage.ChatName + ".", "black");
                    }
                    break;
                case "NewChat":
                    if (JsonMessage.Status == "ok") {
                        Lettuce.Default.AddChat(JsonMessage.Chat);
                        Lettuce.Messages.ChangeChat(JsonMessage.Chat.ChatID);
                    }
                case "GetCurrentUsers":
                    document.getElementById("divUserList").innerHTML = Lettuce.Me.DisplayName + " (you)";
                    for (var i = 0; i < JsonMessage.Users.length; i++) {
                        document.getElementById("divUserList").innerHTML += "<br/>" + JsonMessage.Users[i];
                    }
                    break;
                default:
                    break;
            }
        }
        Messages.HandleMessage = HandleMessage;
    })(Messages = Lettuce.Messages || (Lettuce.Messages = {}));
})(Lettuce || (Lettuce = {}));
//# sourceMappingURL=messages.js.map