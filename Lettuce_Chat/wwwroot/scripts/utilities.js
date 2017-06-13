var Lettuce;
(function (Lettuce) {
    var Utilities;
    (function (Utilities) {
        function ShowDialog(title, content) {
            var dialog = document.createElement("div");
            dialog.innerHTML = content;
        }
        Utilities.ShowDialog = ShowDialog;
        function ShowDialogEx(title, content, buttons) {
            var dialog = document.createElement("div");
            dialog.innerHTML = content;
        }
        Utilities.ShowDialogEx = ShowDialogEx;
    })(Utilities = Lettuce.Utilities || (Lettuce.Utilities = {}));
})(Lettuce || (Lettuce = {}));
//# sourceMappingURL=utilities.js.map