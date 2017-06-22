namespace Lettuce.Utilities {
    export function ShowDialog(Title: string, Content: string, ButtonAction: () => void) {
        var dialog = document.createElement("div");
        dialog.classList.add("dialog-frame");
        var divTitleFrame = document.createElement("div");
        divTitleFrame.classList.add("dialog-title-frame");
        dialog.appendChild(divTitleFrame);
        var divTitleContent = document.createElement("div");
        divTitleContent.classList.add("dialog-title-content")
        divTitleContent.innerHTML = Title;
        divTitleFrame.appendChild(divTitleContent);
        var divDialogContent = document.createElement("div");
        divDialogContent.classList.add("dialog-content");
        divDialogContent.innerHTML = Content;
        dialog.appendChild(divDialogContent);
        var divDialogButtonFrame = document.createElement("div");
        divDialogButtonFrame.classList.add("dialog-button-frame");
        var buttonClose = document.createElement("button");
        
        buttonClose.onclick = function (e) {
            if (ButtonAction) {
                ButtonAction();
            }
            document.body.removeChild(dialog);
        };
        buttonClose.innerHTML = "OK";
        divDialogButtonFrame.appendChild(buttonClose);
        dialog.appendChild(divDialogButtonFrame);
        document.body.appendChild(dialog);
    }
    export function ShowDialogEx(Title:string, Content:string, Buttons:Array<HTMLButtonElement>) {
        var dialog = document.createElement("div");
        dialog.classList.add("dialog-frame");
        var divTitleFrame = document.createElement("div");
        divTitleFrame.classList.add("dialog-title-frame");
        dialog.appendChild(divTitleFrame);
        var divTitleContent = document.createElement("div");
        divTitleContent.classList.add("dialog-title-content")
        divTitleContent.innerHTML = Title;
        divTitleFrame.appendChild(divTitleContent);
        var divDialogContent = document.createElement("div");
        divDialogContent.classList.add("dialog-content");
        divDialogContent.innerHTML = Content;
        dialog.appendChild(divDialogContent);
        var divDialogButtonFrame = document.createElement("div");
        divDialogButtonFrame.classList.add("dialog-button-frame");
        for (var i = 0; i < Buttons.length; i++) {
            divDialogButtonFrame.appendChild(Buttons[i]);
        }
        dialog.appendChild(divDialogButtonFrame);
        document.body.appendChild(dialog);
    }
    export function FadeIn(Elem: HTMLElement, Callback?: Function) {
        if (Elem.classList.contains("hidden")) {
            Elem.classList.remove("hidden");
        }
        if (!Elem.style.opacity) {
            Elem.style.opacity = "0";
        }
        Elem.style.opacity = String(Number(Elem.style.opacity) + .01);
        if (Number(Elem.style.opacity) < 1) {
            window.setTimeout(() => {
                FadeIn(Elem, Callback);
            }, 5)
        }
        else
        {
            if (Callback) {
                Callback();
            }
        }
    }
    export function FadeOut(Elem: HTMLElement, HideAfter: boolean, Callback?: Function) {
        if (!Elem.style.opacity) {
            Elem.style.opacity = "1";
        }
        Elem.style.opacity = String(Number(Elem.style.opacity) - .01);
        if (Number(Elem.style.opacity) > 0) {
            window.setTimeout(() => {
                FadeOut(Elem, HideAfter, Callback);
            }, 5)
        }
        else {
            if (HideAfter) {
                Elem.classList.add("hidden");
            }
            if (Callback) {
                Callback();
            }
        }
    }
    export function ShowTooltip(Content: string, FontColor: string) {
        var tooltip = document.createElement("div");
        tooltip.classList.add("tooltip-frame");
        tooltip.style.color = FontColor;
        tooltip.innerHTML = Content;
        tooltip.style.zIndex = "4";
        document.body.appendChild(tooltip);
        window.setTimeout(() => {
            FadeOut(tooltip, true);
            window.setTimeout(() => {
                document.body.removeChild(tooltip);
            }, Content.length * 20);
        }, 1500)
    }
}