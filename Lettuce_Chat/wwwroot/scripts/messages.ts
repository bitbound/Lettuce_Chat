namespace Lettuce.Messages {
    export function GetGuestChat() {
        var request = {
            "Type": "GetGuestChat"
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function TryResumeLogin() {
        var request = {
            "Type": "TryResumeLogin",
            "Username": Lettuce.Me.Username,
            "AuthenticationToken": Lettuce.Me.AuthenticationToken
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function JoinChat(ChatID: string) {
        var request = {
            "Type": "JoinChat",
            "Username": Lettuce.Me.Username || "",
            "AuthenticationToken": Lettuce.Me.AuthenticationToken,
            "ChatID": ChatID
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function ChangeChat(ChatID: string) {
        var request = {
            "Type": "ChangeChat",
            "ChatID": ChatID
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function GetChatHistory(StartDate: Date) {
        var request = {
            "Type": "GetChatHistory",
            "Start": StartDate
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function GetChatInfo(ChatID: string) {
        var request = {
            "Type": "GetChatInfo",
            "ChatID": ChatID
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function AddMember() {
        var username = (document.getElementById("inputAddMember") as HTMLInputElement).value;
        var chatID = (document.getElementById("inputChatID") as HTMLInputElement).value;
        var request = {
            "Type": "AddMember",
            "Username": username,
            "ChatID": chatID
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function AddAdmin() {
        var username = (document.getElementById("inputAddAdmin") as HTMLInputElement).value;
        var chatID = (document.getElementById("inputChatID") as HTMLInputElement).value;
        var request = {
            "Type": "AddAdmin",
            "Username": username,
            "ChatID": chatID
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function UpdateDisplayName() {
        var request = {
            "Type": "UpdateDisplayName",
            "DisplayName": Lettuce.Me.DisplayName
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function NewChat() {
        var request = {
            "Type": "NewChat"
        }
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function DeleteChat() {
        var yes = document.createElement("button");
        yes.innerHTML = "Yes";
        yes.onclick = function (e) {
            var chatID = (document.getElementById("inputChatID") as HTMLInputElement).value;
            var request = {
                "Type": "DeleteChat",
                "ChatID": chatID
            }
            Lettuce.Socket.send(JSON.stringify(request));
            document.getElementById("divEditChatForm").classList.add("hidden");
            document.getElementById("chat-" + chatID).remove();
            document.body.removeChild((e.currentTarget as HTMLButtonElement).parentElement.parentElement);
        };
        var no = document.createElement("button");
        no.innerHTML = "No";
        no.onclick = function (e) {
            document.body.removeChild((e.currentTarget as HTMLButtonElement).parentElement.parentElement);
        }
        Lettuce.Utilities.ShowDialogEx("Delete Chat", "Are you sure you want to delete this chat?", [yes, no]);
        
    }
    export function HandleMessage(jsonMessage: any) {
        switch (jsonMessage.Type) {
            case "GetGuestChat":
                if (jsonMessage.Status == "ok") {
                    Lettuce.Me.Username = jsonMessage.User.Username;
                    Lettuce.Me.DisplayName = jsonMessage.User.DisplayName;
                    Lettuce.Me.AuthenticationToken = jsonMessage.User.AuthenticationTokens[0];
                    Lettuce.Default.AddChat(jsonMessage.Chat);
                    document.getElementById("chat-" + jsonMessage.Chat.ChatID).classList.add("selected");
                    (document.getElementById("inputChatLink") as HTMLInputElement).value = location.origin + "/?chat=" + jsonMessage.Chat.ChatID;
                    Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true, function () {
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"));
                    });
                }
                break;
            case "TryResumeLogin":
                if (jsonMessage.Status == "not found") {
                    Lettuce.Me.ClearCreds();
                }
                else if (jsonMessage.Status == "expired") {
                    Lettuce.Me.ClearCreds();
                    Lettuce.Utilities.ShowDialog("Session Expired", "Your logon session expired.  You must log in again.", null);
                }
                else if (jsonMessage.Status == "locked") {
                    Lettuce.Utilities.ShowDialog("Account Locked", "Your account is temporarily locked due to bad login attempts.  Try logging in again later.", null);
                }
                else if (jsonMessage.Status == "ok") {
                    Lettuce.Me.DisplayName = jsonMessage.DisplayName;
                    Lettuce.Me.AuthenticationToken = jsonMessage.AuthenticationToken;
                    for (var i = 0; i < jsonMessage.Chats.length; i++) {
                        Lettuce.Default.AddChat(jsonMessage.Chats[i]);
                    }
                    if (jsonMessage.Chats.length > 0) {
                       
                        Lettuce.Messages.ChangeChat(jsonMessage.Chats[0].ChatID);
                    }
                    if (jsonMessage.AccountType == 1) {
                        document.getElementById("spanLogIn").classList.add("hidden");
                        document.getElementById("spanLogOut").classList.remove("hidden");
                    }
                    Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true, function () {
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"), function () {
                            var messageDiv = document.getElementById("divMessages");
                            messageDiv.scrollTop = messageDiv.scrollHeight;
                        });
                    });
                }
                break;
            case "ChangeChat":
                if (jsonMessage.Status == "not found") {
                    Lettuce.Utilities.ShowDialog("Chat Not Found", "The selected chat wasn't found.  Try reloading the page.", null);
                }
                else if (jsonMessage.Status == "unauthorized") {
                    Lettuce.Utilities.ShowDialog("Access Denied", "You are not authorized to access this chat.", null);
                }
                else if (jsonMessage.Status == "ok") {
                    var labels = document.getElementsByClassName("chat-label");
                    for (var i = 0; i < labels.length; i++) {
                        labels[i].classList.remove("selected");
                    }
                    document.getElementById("chat-" + jsonMessage.ChatID).classList.add("selected");
                    (document.getElementById("inputChatLink") as HTMLInputElement).value = location.origin + "/?chat=" + jsonMessage.ChatID;
                    if (document.getElementById("divMainMenu").classList.contains("menu-open")) {
                        Lettuce.Default.ToggleMainMenu();
                    }
                    document.getElementById("divMessages").innerHTML = "";
                    Utilities.ShowTooltip("Joined " + jsonMessage.ChatName + ".", "black");
                }
                break;
            case "NewChat":
                if (jsonMessage.Status == "ok") {
                    Lettuce.Default.AddChat(jsonMessage.Chat);
                    Lettuce.Messages.ChangeChat(jsonMessage.Chat.ChatID);
                }
                break;
            case "UserListUpdate":
                document.getElementById("divUserList").innerHTML = "";
                for (var i = 0; i < jsonMessage.Users.length; i++) {
                    document.getElementById("divUserList").innerHTML += jsonMessage.Users[i];
                    if (jsonMessage.Users[i] == Lettuce.Me.DisplayName) {
                        document.getElementById("divUserList").innerHTML += " (you)";
                    }
                    document.getElementById("divUserList").innerHTML += "<br/><br/>";
                }
                break;
            case "UserLeft":
                document.getElementById("divMessages").innerHTML += "<br/><div class='system-message'>" + jsonMessage.DisplayName + " left the chat.</div>";
                var messageDiv = document.getElementById("divMessages");
                messageDiv.scrollTop = messageDiv.scrollHeight;
                break;
            case "UserJoined":
                document.getElementById("divMessages").innerHTML += "<br/><div class='system-message'>" + jsonMessage.DisplayName + " joined the chat.</div>";
                var messageDiv = document.getElementById("divMessages");
                messageDiv.scrollTop = messageDiv.scrollHeight;
                break;
            case "JoinChat":
                if (jsonMessage.Status == "not found") {
                    Lettuce.Utilities.ShowDialog("Chat Not Found", "The provided chat URL wasn't found.", null);
                }
                else if (jsonMessage.Status == "locked") {
                    Lettuce.Utilities.ShowDialog("Account Locked", "Your account is temporarily locked due to bad login attempts.  Try logging in again later.", null);
                }
                else if (jsonMessage.Status == "unauthorized") {
                    Lettuce.Utilities.ShowDialog("Access Denied", "You are not authorized to access this chat.", null);
                }
                else if (jsonMessage.Status == "expired") {
                    Lettuce.Me.ClearCreds();
                    Lettuce.Utilities.ShowDialog("Session Expired", "Your logon session expired.  You must log in again.", null);
                }
                else if (jsonMessage.Status == "ok") {
                    Lettuce.Me.Username = jsonMessage.Username;
                    Lettuce.Me.DisplayName = jsonMessage.DisplayName;
                    Lettuce.Me.AuthenticationToken = jsonMessage.AuthenticationToken;
                    if (jsonMessage.AccountType == 1) {
                        document.getElementById("spanLogIn").classList.add("hidden");
                        document.getElementById("spanLogOut").classList.remove("hidden");
                    }
                    for (var i = 0; i < jsonMessage.Chats.length; i++) {
                        Lettuce.Default.AddChat(jsonMessage.Chats[i]);
                    }
                    document.getElementById("chat-" + jsonMessage.Chat.ChatID).classList.add("selected");
                    (document.getElementById("inputChatLink") as HTMLInputElement).value = location.origin + "/?chat=" + jsonMessage.Chat.ChatID;
                    Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true, function () {
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"), function () {
                            var messageDiv = document.getElementById("divMessages");
                            messageDiv.scrollTop = messageDiv.scrollHeight;
                        });
                    });
                }
                break;
            case "ChatMessage":
                Lettuce.Default.AddMessage(jsonMessage);
                break;
            case "FileTransfer":
                Lettuce.Default.AddFileTransfer(jsonMessage);
                break;
            case "Typing":
                var statusDiv = document.getElementById("divStatus");
                statusDiv.classList.remove("hidden");
                statusDiv.style.opacity = "1";
                document.getElementById("divStatus").innerHTML = jsonMessage.DisplayName + " is typing...";
                if (window["TypingTimeout"]) {
                    window.clearTimeout(window["TypingTimeout"]);
                }
                window["TypingTimeout"] = window.setTimeout(function () {
                    Lettuce.Utilities.FadeOut(statusDiv, false);
                }, 1000)
                break;
            case "UpdateDisplayName":
                if (jsonMessage.Status == "too long") {
                    Lettuce.Utilities.ShowDialog("Max Length Exceeded", "Your display name must be 20 characters or less.", null);
                }
                else if (jsonMessage.Status == "blank") {
                    Lettuce.Utilities.ShowDialog("Not Allowed", "Your display name can't be empty.", null);
                }
                else if (jsonMessage.Status == "ok") {
                    Lettuce.Utilities.ShowTooltip("Display name updated.", "black");
                }
                break;
            case "GetChatInfo":
                if (jsonMessage.Status == "not found") {
                    Lettuce.Utilities.ShowDialog("Chat Not Found", "The selected chat wasn't found.  Try reloading the page.", null);
                }
                else if (jsonMessage.Status == "unauthorized") {
                    Lettuce.Utilities.ShowDialog("Access Denied", "You are not authorized to edit this chat.", null);
                }
                else if (jsonMessage.Status == "ok") {
                    (document.getElementById("inputChatID") as HTMLInputElement).value = jsonMessage.Chat.ChatID;
                    (document.getElementById("inputChatName") as HTMLInputElement).value = jsonMessage.Chat.ChatName;
                    for (var i = 0; i < jsonMessage.Chat.MemberList; i++) {
                        (document.getElementById("selectMembers") as HTMLSelectElement).innerHTML += "<option>" + jsonMessage.Chat.MemberList[i] + "</option>";
                    }
                    for (var i = 0; i < jsonMessage.Chat.AdminList; i++) {
                        (document.getElementById("selectAdmins") as HTMLSelectElement).innerHTML += "<option>" + jsonMessage.Chat.AdminList[i] + "</option>";
                    }
                    if (jsonMessage.Chat.IsMemberOnly) {
                        (document.getElementById("toggleMemberOnly") as HTMLDivElement).setAttribute("on", "true");
                    }
                    else
                    {
                        (document.getElementById("toggleMemberOnly") as HTMLDivElement).setAttribute("on", "false");
                    }
                    document.getElementById("divEditChatForm").classList.remove("hidden");
                    Lettuce.Default.ToggleMainMenu();
                }
                break;
            case "AddMember":
                if (jsonMessage.Status == "ok") {
                    var username = (document.getElementById("inputAddMember") as HTMLInputElement).value;
                    (document.getElementById("selectMembers") as HTMLSelectElement).innerHTML += "<option>" + username + "</option>";
                    (document.getElementById("inputAddMember") as HTMLInputElement).value = "";
                } else if (jsonMessage.Status == "not found") {
                    Lettuce.Utilities.ShowTooltip("User not found.", "black");
                }
                break;
            case "AddAdmin":
                if (jsonMessage.Status == "ok") {
                    var username = (document.getElementById("inputAddAdmin") as HTMLInputElement).value;
                    (document.getElementById("selectAdmins") as HTMLSelectElement).innerHTML += "<option>" + username + "</option>";
                    (document.getElementById("inputAddAdmin") as HTMLInputElement).value = "";
                } else if (jsonMessage.Status == "not found") {
                    Lettuce.Utilities.ShowTooltip("User not found.", "black");
                }
                break;
            case "ChatUpdated":
                document.getElementById("chat-" + jsonMessage.ChatID).innerHTML = jsonMessage.ChatName;
                document.getElementById("divEditChatForm").classList.add("hidden");
                break;
            case "LoginCheckUser":
                if (jsonMessage.Status == true) {
                    Utilities.ShowTooltip("Please enter your password.", "black");
                    var login = (document.getElementById("inputLoginUsername") as HTMLInputElement);
                    var pw = (document.getElementById("inputLoginPassword") as HTMLInputElement);
                    login.readOnly = true;
                    Utilities.FadeIn(pw.parentElement);
                    pw.focus();
                }
                else if (jsonMessage.Status == false) {
                    Utilities.ShowTooltip("New account!  Please choose a password.", "black");
                    var login = (document.getElementById("inputLoginUsername") as HTMLInputElement);
                    var pw = (document.getElementById("inputLoginPassword") as HTMLInputElement);
                    var pw2 = (document.getElementById("inputLoginConfirmPassword") as HTMLInputElement);
                    login.readOnly = true;
                    Utilities.FadeIn(pw.parentElement);
                    Utilities.FadeIn(pw2.parentElement);
                    pw.focus();
                }
            case "LoginExistingUser":
                if (jsonMessage.Status == "invalid") {
                    Lettuce.Utilities.ShowDialog("Password Incorrect", "The supplied password is incorrect.", null);
                }
                else if (jsonMessage.Status == "locked") {
                    Lettuce.Utilities.ShowDialog("Account Locked", "Your account is temporarily locked due to bad login attempts.  Try logging in again later.", null);
                    return;
                }
                else if (jsonMessage.Status == "ok") {
                    Lettuce.Me.Username = jsonMessage.Username;
                    Lettuce.Me.DisplayName = jsonMessage.DisplayName;
                    Lettuce.Me.AuthenticationToken = jsonMessage.AuthenticationToken;
                    for (var i = 0; i < jsonMessage.Chats.length; i++) {
                        Lettuce.Default.AddChat(jsonMessage.Chats[i]);
                    }
                    if (jsonMessage.Chats.length > 0) {

                        Lettuce.Messages.ChangeChat(jsonMessage.Chats[0].ChatID);
                        document.getElementById("chat-" + jsonMessage.Chats[0].ChatID).classList.add("selected");
                        (document.getElementById("inputChatLink") as HTMLInputElement).value = location.origin + "/?chat=" + jsonMessage.Chats[0].ChatID;
                    }
                    if (jsonMessage.AccountType == 1) {
                        document.getElementById("spanLogIn").classList.add("hidden");
                        document.getElementById("spanLogOut").classList.remove("hidden");
                    }
                    
                    Lettuce.Default.HideLogin();
                    Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true, function () {
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"), function () {
                            var messageDiv = document.getElementById("divMessages");
                            messageDiv.scrollTop = messageDiv.scrollHeight;
                        });
                    });
                }
                break;
            case "LoginNewUser":
                if (jsonMessage.Status == "ok") {
                    Lettuce.Me.Username = jsonMessage.Username;
                    Lettuce.Me.DisplayName = jsonMessage.DisplayName;
                    Lettuce.Me.AuthenticationToken = jsonMessage.AuthenticationToken;
                    for (var i = 0; i < jsonMessage.Chats.length; i++) {
                        Lettuce.Default.AddChat(jsonMessage.Chats[i]);
                    }
                    if (jsonMessage.Chats.length > 0) {

                        Lettuce.Messages.ChangeChat(jsonMessage.Chats[0].ChatID);
                        document.getElementById("chat-" + jsonMessage.Chats[0].ChatID).classList.add("selected");
                        (document.getElementById("inputChatLink") as HTMLInputElement).value = location.origin + "/?chat=" + jsonMessage.Chats[0].ChatID;
                    }
                    if (jsonMessage.AccountType == 1) {
                        document.getElementById("spanLogIn").classList.add("hidden");
                        document.getElementById("spanLogOut").classList.remove("hidden");
                    }

                    Lettuce.Default.HideLogin();
                    Lettuce.Utilities.FadeOut(document.getElementById("divLogin"), true, function () {
                        Lettuce.Utilities.FadeIn(document.getElementById("divChatFrame"), function () {
                            var messageDiv = document.getElementById("divMessages");
                            messageDiv.scrollTop = messageDiv.scrollHeight;
                        });
                    });
                }
                break;
            case "GetChatHistory":
                var messageDiv = document.getElementById("divMessages");
                var currentContent = messageDiv.innerHTML;
                messageDiv.innerHTML = "";
                for (var i = 0; i < jsonMessage.Messages.length; i++){
                    Lettuce.Default.AddMessage(jsonMessage.Messages[i]);
                }

                messageDiv.scrollTop = messageDiv.scrollHeight;
                messageDiv.innerHTML += currentContent;
                break;
            case "DeleteChat":
                if (jsonMessage.Status == "failed") {
                    Lettuce.Utilities.ShowDialog("Deletion Failed", "Failed to delete chat.  Try again in a moment.", null);
                }
                else if (jsonMessage.Status == "ok") {
                    document.getElementById("divEditChatForm").classList.add("hidden");
                    if (document.getElementById("chat-" + jsonMessage.ChatID))
                    {
                        document.getElementById("chat-" + jsonMessage.ChatID).remove();
                    }
                    document.getElementById("divUserList").innerHTML = "";
                    document.getElementById("divMessages").innerHTML = "";
                    (document.getElementById("inputChatLink") as HTMLInputElement).value = "";
                    Lettuce.Utilities.ShowDialog("Chat Deleted", "The chat you were in has been deleted.", null);
                }
                break;
            case "CommandOutput":
                var command = document.createElement("div");
                command.classList.add("system-message");
                command.innerHTML = jsonMessage.Output;
                var messageDiv = document.getElementById("divMessages");
                messageDiv.appendChild(command);
                messageDiv.scrollTop = messageDiv.scrollHeight;
                break;
            case "AccountDeleted":
                Lettuce.Me.ClearCreds();
                window.setTimeout(function () {
                    Lettuce.Utilities.ShowDialog("Account Deleted", "Your account has been deleted.", function () { location.reload(); })
                }, 500);
                
                break;
            case "ExitChat":
                document.getElementById("divUserList").innerHTML = "";
                document.getElementById("divMessages").innerHTML = "";
                (document.getElementById("inputChatLink") as HTMLInputElement).value = "";
                Utilities.ShowTooltip("You have left the chat.", "black");
                document.getElementsByClassName("chat-label selected")[0].remove();
                break;
            default:
                break;
        }
    }
}