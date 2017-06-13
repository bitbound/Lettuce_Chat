const dgi = document.getElementById;
const dgc = document.getElementsByClassName;
const dgt = document.getElementsByTagName;
namespace Lettuce {
    export var Socket: WebSocket;
    export function Init() {
        if (Socket != undefined && Socket.readyState != WebSocket.CLOSED) {
            throw "WebSocket already exists and is not closed.";
        }
        Socket = new WebSocket(location.origin.replace("http", "ws") + "/Socket");
        SetHandlers();
    }
    export function SetHandlers() {
        Socket.onopen = function (e) {

        };
        Socket.onclose = function (e) {

        };
        Socket.onerror = function (e) {

        };
        Socket.onmessage = function (e) {
            Lettuce.HandleMessage(JSON.parse(e.data));
        };
    }
    export function HandleMessage(JsonMessage:any) {

    }
}

window.onload = function () {
    Lettuce.Init();
}