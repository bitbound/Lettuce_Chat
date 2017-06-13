namespace Lettuce.Utilities {
    export function ShowDialog(title, content) {
        var dialog = document.createElement("div");
        dialog.innerHTML = content;
        
    }
    export function ShowDialogEx(title, content, buttons) {
        var dialog = document.createElement("div");
        dialog.innerHTML = content;
        
    }
}