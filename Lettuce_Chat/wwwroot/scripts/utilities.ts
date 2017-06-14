namespace Lettuce.Utilities {
    export function ShowDialog(title:string, content:string) {
        var dialog = document.createElement("div");
        dialog.classList.add("dialog-frame");
        var divTitleFrame = document.createElement("div");
        divTitleFrame.classList.add("dialog-title-frame");
        dialog.appendChild(divTitleFrame);
        var divTitleContent = document.createElement("div");
        divTitleContent.classList.add("dialog-title-content")
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
    export function ShowDialogEx(title:string, content:string, buttons:Array<HTMLButtonElement>) {
        var dialog = document.createElement("div");
        dialog.classList.add("dialog-frame");
        var divTitleFrame = document.createElement("div");
        divTitleFrame.classList.add("dialog-title-frame");
        dialog.appendChild(divTitleFrame);
        var divTitleContent = document.createElement("div");
        divTitleContent.classList.add("dialog-title-content")
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
    export function FadeIn(Elem: HTMLElement) {
        if (Elem.hasAttribute("hidden")) {
            Elem.removeAttribute("hidden");
        }
        if (!Elem.style.opacity) {
            Elem.style.opacity = "0";
        }
        Elem.style.opacity = String(Number(Elem.style.opacity) + .01);
        if (Number(Elem.style.opacity) < 1) {
            window.setTimeout(() => {
                FadeIn(Elem);
            }, 5)
        }
    }
    export function FadeOut(Elem: HTMLElement) {
        if (!Elem.style.opacity) {
            Elem.style.opacity = "1";
        }
        Elem.style.opacity = String(Number(Elem.style.opacity) - .01);
        if (Number(Elem.style.opacity) > 0) {
            window.setTimeout(() => {
                FadeOut(Elem);
            }, 5)
        }
        else {
            Elem.setAttribute("hidden", "");
        }
    }
    export function ShowTooltip(Content: string, FontColor: string) {
        var tooltip = document.createElement("div");
        tooltip.classList.add("tooltip-frame");
        tooltip.style.color = FontColor;
        tooltip.innerHTML = Content;
        document.body.appendChild(tooltip);
        window.setTimeout(() => {
            FadeOut(tooltip);
            window.setTimeout(() => {
                document.body.removeChild(tooltip);
            }, 750);
        }, 1500)
    }
}