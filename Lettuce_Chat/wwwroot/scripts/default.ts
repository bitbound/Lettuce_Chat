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
        var login = document.getElementById("divLoginForm") as HTMLDivElement;
        login.style.opacity = "0";
        login.removeAttribute("hidden");
        Lettuce.Utilities.FadeIn(login);
    }
    export function HideLogin() {
        var login = document.getElementById("divLoginForm") as HTMLDivElement;
        Lettuce.Utilities.FadeOut(login);
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
                    Lettuce.Utilities.ShowDialog("Upload Failed", "File upload failed.");
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
        var sentChat = document.createElement("div");
        sentChat.classList.add("sent-chat");
        sentChat.innerHTML = '<div class="arrow-right"></div><div class="chat-message-header">You at ' + new Date().toLocaleTimeString() + "</div>" + message;
        var messageDiv = document.getElementById("divMessages");
        messageDiv.appendChild(sentChat);
        messageDiv.scrollTop = messageDiv.scrollHeight;
        var encoded = btoa(message);
        var request = {
            "Type": "ChatMessage",
            "Message": encoded
        };
        Lettuce.Socket.send(JSON.stringify(request));
    }
    export function InputKeyDown(e) {
        if (e.key.toLowerCase() == "enter" && e.shiftKey == false) {
            e.preventDefault();
            document.getElementById("buttonSend").click();
        }
        ;
        var request = {
            "Type": "Typing"
        };
        Lettuce.Socket.send(JSON.stringify(request));
    }
}