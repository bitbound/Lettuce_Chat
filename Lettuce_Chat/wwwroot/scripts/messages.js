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
                "Username": Lettuce.Me.Username || "",
                "AuthenticationToken": Lettuce.Me.AuthenticationToken,
                "ChatID": ChatID
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
        function GetChatHistory(StartPoint) {
            var request = {
                "Type": "GetChatHistory",
                "Start": StartPoint
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.GetChatHistory = GetChatHistory;
        function GetChatInfo(ChatID) {
            var request = {
                "Type": "GetChatInfo",
                "ChatID": ChatID
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.GetChatInfo = GetChatInfo;
        function AddMember() {
            var username = document.getElementById("inputAddMember").value;
            var chatID = document.getElementById("inputChatID").value;
            var request = {
                "Type": "AddMember",
                "Username": username,
                "ChatID": chatID
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.AddMember = AddMember;
        function AddAdmin() {
            var username = document.getElementById("inputAddAdmin").value;
            var chatID = document.getElementById("inputChatID").value;
            var request = {
                "Type": "AddAdmin",
                "Username": username,
                "ChatID": chatID
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.AddAdmin = AddAdmin;
        function UpdateDisplayName() {
            var request = {
                "Type": "UpdateDisplayName",
                "DisplayName": Lettuce.Me.DisplayName
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.UpdateDisplayName = UpdateDisplayName;
        function NewChat() {
            var request = {
                "Type": "NewChat"
            };
            Lettuce.Socket.send(JSON.stringify(request));
        }
        Messages.NewChat = NewChat;
        function DeleteChat() {
            var yes = document.createElement("button");
            yes.innerHTML = "Yes";
            yes.onclick = function () {
                var chatID = document.getElementById("inputChatID").value;
                var request = {
                    "Type": "DeleteChat",
                    "ChatID": chatID
                };
                Lettuce.Socket.send(JSON.stringify(request));
            };
            var no = document.createElement("button");
            no.innerHTML = "No";
            no.onclick = function (e) {
                document.body.removeChild(e.currentTarget.parentElement.parentElement);
            };
            Lettuce.Utilities.ShowDialogEx("Delete Chat", "Are you sure you want to delete this chat?", [yes, no]);
        }
        Messages.DeleteChat = DeleteChat;
        function HandleMessage(JsonMessage) {
            switch (JsonMessage.Type) {
                case "GetGuestChat":
                    if (JsonMessage.Status == "ok") {
                        Lettuce.Me.Username = JsonMessage.User.Username;
                        Lettuce.Me.DisplayName = JsonMessage.User.DisplayName;
                        Lettuce.Me.AuthenticationToken = JsonMessage.User.AuthenticationTokens[0];
                        Lettuce.Default.AddChat(JsonMessage.Chat);
                        document.getElementById("chat-" + JsonMessage.Chat.ChatID).classList.add("selected");
                        document.getElementById("inputChatLink").value = location.origin + "/?chat=" + JsonMessage.Chat.ChatID;
                        Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true);
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"));
                    }
                    break;
                case "TryResumeLogin":
                    if (JsonMessage.Status == "not found") {
                        Lettuce.Me.ClearCreds();
                    }
                    else if (JsonMessage.Status == "expired") {
                        Lettuce.Me.ClearCreds();
                        Lettuce.Utilities.ShowDialog("Session Expired", "Your logon session expired.  You must log in again.", null);
                    }
                    else if (JsonMessage.Status == "locked") {
                        Lettuce.Utilities.ShowDialog("Account Locked", "Your account is temporarily locked due to bad login attempts.  Try logging in again later.", null);
                    }
                    else if (JsonMessage.Status == "ok") {
                        Lettuce.Me.DisplayName = JsonMessage.DisplayName;
                        Lettuce.Me.AuthenticationToken = JsonMessage.AuthenticationToken;
                        for (var i = 0; i < JsonMessage.Chats.length; i++) {
                            Lettuce.Default.AddChat(JsonMessage.Chats[i]);
                        }
                        if (JsonMessage.Chats.length > 0) {
                            Lettuce.Messages.ChangeChat(JsonMessage.Chats[0].ChatID);
                        }
                        if (JsonMessage.AccountType == 1) {
                            document.getElementById("spanLogIn").setAttribute("hidden", "");
                            document.getElementById("spanLogOut").removeAttribute("hidden");
                        }
                        Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true);
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"));
                    }
                    break;
                case "ChangeChat":
                    if (JsonMessage.Status == "not found") {
                        Lettuce.Utilities.ShowDialog("Chat Not Found", "The selected chat wasn't found.  Try reloading the page.", null);
                    }
                    else if (JsonMessage.Status == "unauthorized") {
                        Lettuce.Utilities.ShowDialog("Access Denied", "You are not authorized to access this chat.", null);
                    }
                    else if (JsonMessage.Status == "ok") {
                        var labels = document.getElementsByClassName("chat-label");
                        for (var i = 0; i < labels.length; i++) {
                            labels[i].classList.remove("selected");
                        }
                        document.getElementById("chat-" + JsonMessage.ChatID).classList.add("selected");
                        document.getElementById("inputChatLink").value = location.origin + "/?chat=" + JsonMessage.ChatID;
                        if (document.getElementById("divMainMenu").classList.contains("menu-open")) {
                            Lettuce.Default.ToggleMainMenu();
                        }
                        document.getElementById("divMessages").innerHTML = "";
                        Lettuce.Utilities.ShowTooltip("Joined " + JsonMessage.ChatName + ".", "black");
                    }
                    break;
                case "NewChat":
                    if (JsonMessage.Status == "ok") {
                        Lettuce.Default.AddChat(JsonMessage.Chat);
                        Lettuce.Messages.ChangeChat(JsonMessage.Chat.ChatID);
                    }
                    break;
                case "UserListUpdate":
                    document.getElementById("divUserList").innerHTML = "";
                    for (var i = 0; i < JsonMessage.Users.length; i++) {
                        document.getElementById("divUserList").innerHTML += JsonMessage.Users[i];
                        if (JsonMessage.Users[i] == Lettuce.Me.DisplayName) {
                            document.getElementById("divUserList").innerHTML += " (you)";
                        }
                        document.getElementById("divUserList").innerHTML += "<br/><br/>";
                    }
                    break;
                case "UserLeft":
                    document.getElementById("divMessages").innerHTML += "<br/><div class='system-message'>" + JsonMessage.DisplayName + " left the chat.</div>";
                    var messageDiv = document.getElementById("divMessages");
                    messageDiv.scrollTop = messageDiv.scrollHeight;
                    break;
                case "UserJoined":
                    document.getElementById("divMessages").innerHTML += "<br/><div class='system-message'>" + JsonMessage.DisplayName + " joined the chat.</div>";
                    var messageDiv = document.getElementById("divMessages");
                    messageDiv.scrollTop = messageDiv.scrollHeight;
                    break;
                case "JoinChat":
                    if (JsonMessage.Status == "not found") {
                        Lettuce.Utilities.ShowDialog("Chat Not Found", "The provided chat URL wasn't found.", null);
                    }
                    else if (JsonMessage.Status == "locked") {
                        Lettuce.Utilities.ShowDialog("Account Locked", "Your account is temporarily locked due to bad login attempts.  Try logging in again later.", null);
                    }
                    else if (JsonMessage.Status == "unauthorized") {
                        Lettuce.Utilities.ShowDialog("Access Denied", "You are not authorized to access this chat.", null);
                    }
                    else if (JsonMessage.Status == "expired") {
                        Lettuce.Me.ClearCreds();
                        Lettuce.Utilities.ShowDialog("Session Expired", "Your logon session expired.  You must log in again.", null);
                    }
                    else if (JsonMessage.Status == "ok") {
                        Lettuce.Me.Username = JsonMessage.Username;
                        Lettuce.Me.DisplayName = JsonMessage.DisplayName;
                        Lettuce.Me.AuthenticationToken = JsonMessage.AuthenticationToken;
                        if (JsonMessage.AccountType == 1) {
                            document.getElementById("spanLogIn").setAttribute("hidden", "");
                            document.getElementById("spanLogOut").removeAttribute("hidden");
                        }
                        for (var i = 0; i < JsonMessage.Chats.length; i++) {
                            Lettuce.Default.AddChat(JsonMessage.Chats[i]);
                        }
                        document.getElementById("chat-" + JsonMessage.Chat.ChatID).classList.add("selected");
                        document.getElementById("inputChatLink").value = location.origin + "/?chat=" + JsonMessage.Chat.ChatID;
                        Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true);
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"));
                    }
                    break;
                case "ChatMessage":
                    Lettuce.Default.AddMessage(JsonMessage);
                    break;
                case "Typing":
                    var statusDiv = document.getElementById("divStatus");
                    statusDiv.removeAttribute("hidden");
                    statusDiv.style.opacity = "1";
                    document.getElementById("divStatus").innerHTML = JsonMessage.DisplayName + " is typing...";
                    if (window["TypingTimeout"]) {
                        window.clearTimeout(window["TypingTimeout"]);
                    }
                    window["TypingTimeout"] = window.setTimeout(function () {
                        Lettuce.Utilities.FadeOut(statusDiv, false);
                    }, 1000);
                    break;
                case "UpdateDisplayName":
                    if (JsonMessage.Status == "too long") {
                        Lettuce.Utilities.ShowDialog("Max Length Exceeded", "Your display name must be 20 characters or less.", null);
                    }
                    else if (JsonMessage.Status == "blank") {
                        Lettuce.Utilities.ShowDialog("Not Allowed", "Your display name can't be empty.", null);
                    }
                    else if (JsonMessage.Status == "ok") {
                        Lettuce.Utilities.ShowTooltip("Display name updated.", "black");
                    }
                    break;
                case "GetChatInfo":
                    if (JsonMessage.Status == "not found") {
                        Lettuce.Utilities.ShowDialog("Chat Not Found", "The selected chat wasn't found.  Try reloading the page.", null);
                    }
                    else if (JsonMessage.Status == "unauthorized") {
                        Lettuce.Utilities.ShowDialog("Access Denied", "You are not authorized to edit this chat.", null);
                    }
                    else if (JsonMessage.Status == "ok") {
                        document.getElementById("inputChatID").value = JsonMessage.Chat.ChatID;
                        document.getElementById("inputChatName").value = JsonMessage.Chat.ChatName;
                        for (var i = 0; i < JsonMessage.Chat.MemberList; i++) {
                            document.getElementById("selectMembers").innerHTML += "<option>" + JsonMessage.Chat.MemberList[i] + "</option>";
                        }
                        for (var i = 0; i < JsonMessage.Chat.AdminList; i++) {
                            document.getElementById("selectAdmins").innerHTML += "<option>" + JsonMessage.Chat.AdminList[i] + "</option>";
                        }
                        if (JsonMessage.Chat.IsMemberOnly) {
                            document.getElementById("toggleMemberOnly").setAttribute("on", "true");
                        }
                        else {
                            document.getElementById("toggleMemberOnly").setAttribute("on", "false");
                        }
                        document.getElementById("divEditChatForm").removeAttribute("hidden");
                        document.getElementById("divEditChatForm").style.opacity = "1";
                        Lettuce.Default.ToggleMainMenu();
                    }
                    break;
                case "AddMember":
                    if (JsonMessage.Status == "ok") {
                        var username = document.getElementById("inputAddMember").value;
                        document.getElementById("selectMembers").innerHTML += "<option>" + username + "</option>";
                        document.getElementById("inputAddMember").value = "";
                    }
                    else if (JsonMessage.Status == "not found") {
                        Lettuce.Utilities.ShowTooltip("User not found.", "black");
                    }
                    break;
                case "AddAdmin":
                    if (JsonMessage.Status == "ok") {
                        var username = document.getElementById("inputAddAdmin").value;
                        document.getElementById("selectAdmin").innerHTML += "<option>" + username + "</option>";
                        document.getElementById("inputAddAdmin").value = "";
                    }
                    else if (JsonMessage.Status == "not found") {
                        Lettuce.Utilities.ShowTooltip("User not found.", "black");
                    }
                    break;
                case "ChatUpdated":
                    Lettuce.Messages.ChangeChat(JsonMessage.ChatID);
                    document.getElementById("divEditChatForm").setAttribute("hidden", "");
                    break;
                case "LoginCheckUser":
                    if (JsonMessage.Status == true) {
                        Lettuce.Utilities.ShowTooltip("Please enter your password.", "black");
                        var login = document.getElementById("inputLoginUsername");
                        var pw = document.getElementById("inputLoginPassword");
                        login.readOnly = true;
                        Lettuce.Utilities.FadeIn(pw.parentElement);
                        pw.focus();
                    }
                    else if (JsonMessage.Status == false) {
                        Lettuce.Utilities.ShowTooltip("New account!  Please choose a password.", "black");
                        var login = document.getElementById("inputLoginUsername");
                        var pw = document.getElementById("inputLoginPassword");
                        var pw2 = document.getElementById("inputLoginConfirmPassword");
                        login.readOnly = true;
                        Lettuce.Utilities.FadeIn(pw.parentElement);
                        Lettuce.Utilities.FadeIn(pw2.parentElement);
                        pw.focus();
                    }
                case "LoginExistingUser":
                    if (JsonMessage.Status == "invalid") {
                        Lettuce.Utilities.ShowDialog("Password Incorrect", "The supplied password is incorrect.", null);
                    }
                    else if (JsonMessage.Status == "locked") {
                        Lettuce.Utilities.ShowDialog("Account Locked", "Your account is temporarily locked due to bad login attempts.  Try logging in again later.", null);
                        return;
                    }
                    else if (JsonMessage.Status == "ok") {
                        Lettuce.Me.Username = JsonMessage.Username;
                        Lettuce.Me.DisplayName = JsonMessage.DisplayName;
                        Lettuce.Me.AuthenticationToken = JsonMessage.AuthenticationToken;
                        for (var i = 0; i < JsonMessage.Chats.length; i++) {
                            Lettuce.Default.AddChat(JsonMessage.Chats[i]);
                        }
                        if (JsonMessage.Chats.length > 0) {
                            Lettuce.Messages.ChangeChat(JsonMessage.Chats[0].ChatID);
                            document.getElementById("chat-" + JsonMessage.Chats[0].ChatID).classList.add("selected");
                            document.getElementById("inputChatLink").value = location.origin + "/?chat=" + JsonMessage.Chats[0].ChatID;
                        }
                        if (JsonMessage.AccountType == 1) {
                            document.getElementById("spanLogIn").setAttribute("hidden", "");
                            document.getElementById("spanLogOut").removeAttribute("hidden");
                        }
                        Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true);
                        Lettuce.Default.HideLogin();
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"));
                    }
                    break;
                case "LoginNewUser":
                    if (JsonMessage.Status == "ok") {
                        Lettuce.Me.Username = JsonMessage.Username;
                        Lettuce.Me.DisplayName = JsonMessage.DisplayName;
                        Lettuce.Me.AuthenticationToken = JsonMessage.AuthenticationToken;
                        for (var i = 0; i < JsonMessage.Chats.length; i++) {
                            Lettuce.Default.AddChat(JsonMessage.Chats[i]);
                        }
                        if (JsonMessage.Chats.length > 0) {
                            Lettuce.Messages.ChangeChat(JsonMessage.Chats[0].ChatID);
                            document.getElementById("chat-" + JsonMessage.Chats[0].ChatID).classList.add("selected");
                            document.getElementById("inputChatLink").value = location.origin + "/?chat=" + JsonMessage.Chats[0].ChatID;
                        }
                        if (JsonMessage.AccountType == 1) {
                            document.getElementById("spanLogIn").setAttribute("hidden", "");
                            document.getElementById("spanLogOut").removeAttribute("hidden");
                        }
                        Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true);
                        Lettuce.Default.HideLogin();
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"));
                    }
                    break;
                case "LoginElsewhere":
                    Lettuce.Utilities.ShowDialog("Logged Out", "You've been logged out because your account was logged into from another location.", null);
                    break;
                case "GetChatHistory":
                    var messageDiv = document.getElementById("divMessages");
                    var currentContent = messageDiv.innerHTML;
                    messageDiv.innerHTML = "";
                    for (var i = 0; i < JsonMessage.Messages.length; i++) {
                        var message = JsonMessage.Messages[i];
                        var receivedChat = document.createElement("div");
                        receivedChat.classList.add("received-chat");
                        receivedChat.innerHTML = '<div class="arrow-left"></div><div class="chat-message-header">' + message.DisplayName + ' at ' + new Date(Date.parse(message.TimeStamp)).toLocaleString() + "</div>" + atob(message.Message);
                        messageDiv.appendChild(receivedChat);
                    }
                    messageDiv.scrollTop = messageDiv.scrollHeight;
                    messageDiv.innerHTML += currentContent;
                    break;
                case "DeleteChat":
                    if (JsonMessage.Status == "failed") {
                        Lettuce.Utilities.ShowDialog("Deletion Failed", "Failed to delete chat.  Try again in a moment.", null);
                    }
                    else if (JsonMessage.Status == "ok") {
                        document.getElementById("divEditChatForm").setAttribute("hidden", "");
                        document.getElementById("chat-" + JsonMessage.ChatID).remove();
                        document.getElementById("divUserList").innerHTML = "";
                        document.getElementById("divMessages").innerHTML = "";
                        document.getElementById("inputChatLink").value = "";
                        Lettuce.Utilities.ShowDialog("Chat Deleted", "The chat you're in has been deleted.", null);
                    }
                    break;
                case "CommandOutput":
                    var command = document.createElement("div");
                    command.classList.add("system-message");
                    command.innerHTML = JsonMessage.Output;
                    var messageDiv = document.getElementById("divMessages");
                    messageDiv.appendChild(command);
                    messageDiv.scrollTop = messageDiv.scrollHeight;
                    break;
                case "AccountDeleted":
                    window.setTimeout(function () {
                        Lettuce.Utilities.ShowDialog("Account Deleted", "Your account has been deleted.", function () { location.reload(); });
                    }, 500);
                    break;
                case "ExitChat":
                    document.getElementById("divUserList").innerHTML = "";
                    document.getElementById("divMessages").innerHTML = "";
                    document.getElementById("inputChatLink").value = "";
                    Lettuce.Utilities.ShowTooltip("You have left the chat.", "black");
                    document.getElementsByClassName("chat-label selected")[0].remove();
                    break;
                default:
                    break;
            }
        }
        Messages.HandleMessage = HandleMessage;
    })(Messages = Lettuce.Messages || (Lettuce.Messages = {}));
})(Lettuce || (Lettuce = {}));
//# sourceMappingURL=messages.js.map