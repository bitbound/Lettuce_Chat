namespace Lettuce.Default {
    export function ToggleMainMenu() {
        document.getElementById("divMainMenu").classList.toggle("menu-open");
        document.getElementById("divMainMenuBackground").classList.toggle("menu-open");
    }
    export function ToggleUsersMenu() {
        document.getElementById("divUserListFrame").classList.toggle("menu-open");
        document.getElementById("divMainMenuBackground").classList.toggle("menu-open");
    }
    export function ShowLogin() {
        if (document.getElementById("divMainMenu").classList.contains("menu-open")) {
            Lettuce.Default.ToggleMainMenu();
        }
        var login = document.getElementById("divLoginForm") as HTMLDivElement;
        Lettuce.Utilities.FadeIn(login);
        (document.getElementById("inputLoginUsername") as HTMLInputElement).focus();
    }
    export function HideLogin() {
        var form = document.getElementById("divLoginForm") as HTMLDivElement;
        var login = (document.getElementById("inputLoginUsername") as HTMLInputElement);
        var pw = (document.getElementById("inputLoginPassword") as HTMLInputElement);
        var pw2 = (document.getElementById("inputLoginConfirmPassword") as HTMLInputElement);
        login.readOnly = false;
        login.value = "";
        pw.parentElement.setAttribute("hidden", "");
        pw.value = "";
        pw2.parentElement.setAttribute("hidden", "");
        pw2.value = "";
        Lettuce.Utilities.FadeOut(form, true);
    }

    export function EvalLoginKey(e:KeyboardEvent) {
        if (e.key.toLowerCase() == 'enter') {
            LoginNext();
        }
    }
    export function LoginNext() {
        var login = (document.getElementById("inputLoginUsername") as HTMLInputElement);
        var pw = (document.getElementById("inputLoginPassword") as HTMLInputElement);
        var pw2 = (document.getElementById("inputLoginConfirmPassword") as HTMLInputElement);
        if (pw.parentElement.hasAttribute("hidden")) {
            if (login.value.length == 0) {
                Lettuce.Utilities.ShowTooltip("You must enter a user name.", "black");
                return;
            }
            var request = {
                "Type": "LoginCheckUser",
                "Username": login.value.trim()
            }
            Lettuce.Socket.send(JSON.stringify(request));
        }
        else if (!pw.parentElement.hasAttribute("hidden") && pw2.parentElement.hasAttribute("hidden"))
        {
            if (pw.value.length == 0) {
                Lettuce.Utilities.ShowTooltip("You must enter your password.", "black");
                return;
            }
            var request2 = {
                "Type": "LoginExistingUser",
                "Username": login.value.trim(),
                "Password": pw.value
            }
            Lettuce.Socket.send(JSON.stringify(request2));
        }
        else if (!pw.parentElement.hasAttribute("hidden") && !pw2.parentElement.hasAttribute("hidden")) {
            if (pw.value.length == 0) {
                Lettuce.Utilities.ShowTooltip("You must enter your password.", "black");
                return;
            }
            if (pw.value != pw2.value) {
                Lettuce.Utilities.ShowTooltip("The passwords don't match.", "black");
                return;
            }
            var request3 = {
                "Type": "LoginNewUser",
                "Username": login.value.trim(),
                "Password": pw.value,
                "Confirm": pw2.value
            }
            Lettuce.Socket.send(JSON.stringify(request3));
        }
    }
    export function RemoveMember() {
        var select = document.getElementById("selectMembers") as HTMLSelectElement;
        for (var i = 0; i < select.selectedOptions.length; i++) {
            select.selectedOptions[i].remove();
        }
    }
    export function RemoveAdmin() {
        var select = document.getElementById("selectAdmins") as HTMLSelectElement;
        for (var i = 0; i < select.selectedOptions.length; i++) {
            select.selectedOptions[i].remove();
        }
    }
    export function SaveChatEdit() {
        var chatID = (document.getElementById("inputChatID") as HTMLInputElement).value;
        var chatName = (document.getElementById("inputChatName") as HTMLInputElement).value;
        var toggleMemberOnly = (document.getElementById("toggleMemberOnly") as HTMLDivElement).getAttribute("on");
        var isMemberOnly;
        if (toggleMemberOnly == "false") {
            isMemberOnly = false;
        }
        else if (toggleMemberOnly == "true") {
            isMemberOnly = true;
        }
        var arrMembers = [];
        var selectMembers = (document.getElementById("selectMembers") as HTMLSelectElement).options;
        for (var i = 0; i < selectMembers.length; i++) {
            arrMembers.push(selectMembers[i].innerHTML);
        }
        var arrAdmins = [];
        var selectAdmins = (document.getElementById("selectAdmins") as HTMLSelectElement).options;
        for (var i = 0; i < selectAdmins.length; i++) {
            arrAdmins.push(selectAdmins[i].innerHTML);
        }
        var request = {
            "Type": "SaveChatEdit",
            "ChatID": chatID,
            "ChatName": chatName,
            "MemberOnly": isMemberOnly,
            "Members": arrMembers,
            "Admins": arrAdmins
        }
        Lettuce.Socket.send(JSON.stringify(request));
        
    }
    export function ToggleMemberOnly() {
        var toggle = document.getElementById("toggleMemberOnly") as HTMLDivElement;
        if (toggle.getAttribute("on") == "false") {
            toggle.setAttribute("on", "true");
        }
        else {
            toggle.setAttribute("on", "false");
        }
    }
    export function AddChat(Chat: Lettuce.Models.Chat) {
        var chatLabel = document.createElement("div");
        chatLabel.classList.add("chat-label");
        chatLabel.innerHTML = Chat.ChatName;
        chatLabel.setAttribute("chat-id", Chat.ChatID);
        chatLabel.id = "chat-" + Chat.ChatID;
        var chatDiv: HTMLDivElement;
        if (Chat.OwnerName == Lettuce.Me.Username) {
            chatDiv = document.getElementById("divMyChats") as HTMLDivElement;
        }
        else {
            chatDiv = document.getElementById("divOtherChats") as HTMLDivElement;
        }
        chatDiv.appendChild(chatLabel);
        chatLabel.onclick = function (e) {
            if ((e.currentTarget as HTMLDivElement).classList.contains("selected"))
            {
                return;
            }
            Lettuce.Messages.ChangeChat((e.currentTarget as HTMLDivElement).getAttribute("chat-id"));
        }
        chatLabel.oncontextmenu = function (e) {
            if (e.button == 2) {
                Lettuce.Messages.GetChatInfo((e.currentTarget as HTMLDivElement).getAttribute("chat-id"));
            }
            return false;
        };
        chatLabel.ontouchstart = function (e) {
            chatLabel.ontouchend = function (e) {
                window["Touching"] = false;
            }
            window["Touching"] = true;
            var chatID = (e.currentTarget as HTMLDivElement).getAttribute("chat-id");
            window.setTimeout(function () {
                if (window["Touching"] == true) {
                    window["Touching"] = false;
                    Lettuce.Messages.GetChatInfo(chatID);
                }
            }, 1000)
        }
    }
    export function CopyLink() {
        var input = document.getElementById("inputChatLink") as HTMLInputElement;
        input.select();
        try {
            var result = document.execCommand("copy");
        }
        catch (ex) {
            Lettuce.Utilities.ShowTooltip("Failed to copy to clipboard.", "red");
        };
        if (result) {
            Lettuce.Utilities.ShowTooltip("Link copied to clipboard.", "black");
        }
        else {
            Lettuce.Utilities.ShowTooltip("Failed to copy to clipboard.", "red");
        };
    }
    export function LogOut() {
        Lettuce.Default.ToggleMainMenu();
        var yes = document.createElement("button");
        yes.innerHTML = "Yes";
        yes.onclick = function () {
            Lettuce.Me.AuthenticationToken = null;
            Lettuce.Me.DisplayName = null;
            Lettuce.Me.Username = null;
            location.href = location.origin;
        };
        var no = document.createElement("button");
        no.innerHTML = "No";
        no.onclick = function (e) {
            document.body.removeChild((e.currentTarget as HTMLButtonElement).parentElement.parentElement);
        }
        Lettuce.Utilities.ShowDialogEx("Log Out", "Are you sure you want to log out?", [yes, no]);
    }
    export function DragOverChat(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    }
    export function DropOnChat(e) {
        e.preventDefault();
        if (e.dataTransfer.files.length < 1) {
            return;
        }
        if (Lettuce.Socket.readyState != WebSocket.OPEN) {
            return;
        }
        TransferFile(e.dataTransfer.files);
    }
    export function TransferFile(e) {
        for (var i = 0; i < e.length; i++) {
            document.getElementById("divStatus").innerHTML = "Uploading file...";
            var file = e[i];
            var strPath = "/FileTransfer/Upload/";
            var fd = new FormData();
            fd.append('fileUpload', file);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', strPath, true);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    document.getElementById("divStatus").innerHTML = "Upload completed.";
                    var fileName = xhr.responseText;
                    var inputElem = (document.getElementById("textInput") as HTMLTextAreaElement);
                    var url = location.origin + "/FileTransfer/Download/?file=" + fileName;
                    inputElem.value = "";
                    if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".png") || fileName.toLowerCase().endsWith(".gif")) {
                        inputElem.value = '<div style="text-align:center"><img src="' + url + '" style="max-width:50vw" /></div><br/>'
                    }
                    else if (fileName.toLowerCase().endsWith(".mp4") || fileName.toLowerCase().endsWith(".webm"))
                    {
                        inputElem.value = '<div style="text-align:center"><video controls="controls" src="' + url + '" style="max-width:50vw" /></div><br/>'
                    }
                    inputElem.value += 'File Sharing Link: <a target="_blank" href="' + url + '">' + fileName + '</a>';
                    SubmitMessage();
                }
                else {
                    
                    document.getElementById("divStatus").innerHTML = "Upload failed.";
                    Lettuce.Utilities.ShowDialog("Upload Failed", "File upload failed.", null);
                }
            };
            xhr.send(fd);
        }
    }
    export function SubmitMessage() {
        var inputElem = (document.getElementById("textInput") as HTMLTextAreaElement);
        if (inputElem.value == "") {
            return;
        }
        var message = inputElem.value.replace("\n", "<br/>");
        inputElem.value = "";
        if (!message.startsWith("/")) {
            var sentChat = document.createElement("div");
            sentChat.classList.add("sent-chat");
            sentChat.innerHTML = '<div class="arrow-right"></div><div class="chat-message-header">You at ' + new Date().toLocaleTimeString() + "</div>" + message;
            var messageDiv = document.getElementById("divMessages");
            messageDiv.appendChild(sentChat);
            messageDiv.scrollTop = messageDiv.scrollHeight;
        }
        var encoded = btoa(message);
        var request = {
            "Type": "ChatMessage",
            "Message": encoded
        };
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function AddMessage(Message: any) {
        var receivedChat = document.createElement("div");
        receivedChat.classList.add("received-chat");
        receivedChat.innerHTML = '<div class="arrow-left"></div><div class="chat-message-header">' + Message.DisplayName + ' at ' + new Date().toLocaleTimeString() + "</div>" + atob(Message.Message);
        var messageDiv = document.getElementById("divMessages");
        messageDiv.appendChild(receivedChat);
        messageDiv.scrollTop = messageDiv.scrollHeight;
    }
    export function InputKeyDown(e) {
        if (e.key.toLowerCase() == "enter" && e.shiftKey == false) {
            e.preventDefault();
            document.getElementById("buttonSend").click();
        }
        ;
        var request = {
            "Type": "Typing",
            "DisplayName": Lettuce.Me.DisplayName
        };
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function MessageScroll(e) {
        var messages = e.currentTarget as HTMLDivElement;
        if (messages.scrollTop == 0) {
            for (var i = 0; i < messages.children.length; i++) {
                if (messages.children[i].classList.contains("received-chat") || messages.children[i].classList.contains("sent-chat"))
                {
                    var strHeader = messages.children[i].children[1].innerHTML;
                    for (var i = 0; i < strHeader.length; i++) {
                        if (!isNaN(Date.parse(strHeader.slice(i)))) {
                            Lettuce.Messages.GetChatHistory(new Date(Date.parse(strHeader.slice(i))));
                            return;
                        }
                    }
                }
            }
        }
    }
}