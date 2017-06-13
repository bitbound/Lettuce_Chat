var Lettuce;
(function (Lettuce) {
    var Utilities;
    (function (Utilities) {
        function ShowDialog(title, content) {
            var dialog = document.createElement("div");
            dialog.classList.add("dialog-frame");
            var divTitleFrame = document.createElement("div");
            divTitleFrame.classList.add("dialog-title-frame");
            dialog.appendChild(divTitleFrame);
            var divTitleContent = document.createElement("div");
            divTitleContent.innerHTML = title;
            divTitleFrame.appendChild(divTitleContent);
            var divDialogContent = document.createElement("div");
            divDialogContent.classList.add("dialog-content");
            divDialogContent.innerHTML = content;
            dialog.appendChild(divDialogContent);
            var divDialogButtonFrame = document.createElement("div");
            divDialogButtonFrame.classList.add("dialog-button-frame");
            var buttonClose = document.createElement("button");
            buttonClose.onclick = function (e) {
                var dialogs = document.getElementsByClassName("dialog-frame");
                for (var i = 0; i < dialogs.length; i++) {
                    document.body.removeChild(dialogs[i]);
                }
            };
            buttonClose.innerHTML = "OK";
            divDialogButtonFrame.appendChild(buttonClose);
            dialog.appendChild(divDialogButtonFrame);
            document.body.appendChild(dialog);
        }
        Utilities.ShowDialog = ShowDialog;
        function ShowDialogEx(title, content, buttons) {
            var dialog = document.createElement("div");
            dialog.classList.add("dialog-frame");
            var divTitleFrame = document.createElement("div");
            divTitleFrame.classList.add("dialog-title-frame");
            dialog.appendChild(divTitleFrame);
            var divTitleContent = document.createElement("div");
            divTitleContent.innerHTML = title;
            divTitleFrame.appendChild(divTitleContent);
            var divDialogContent = document.createElement("div");
            divDialogContent.classList.add("dialog-content");
            divDialogContent.innerHTML = content;
            dialog.appendChild(divDialogContent);
            var divDialogButtonFrame = document.createElement("div");
            divDialogButtonFrame.classList.add("dialog-button-frame");
            for (var i = 0; i < buttons.length; i++) {
                divDialogButtonFrame.appendChild(buttons[i]);
            }
            dialog.appendChild(divDialogButtonFrame);
            document.body.appendChild(dialog);
        }
        Utilities.ShowDialogEx = ShowDialogEx;
    })(Utilities = Lettuce.Utilities || (Lettuce.Utilities = {}));
})(Lettuce || (Lettuce = {}));
//# sourceMappingURL=utilities.js.map