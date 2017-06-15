var Lettuce;
(function (Lettuce) {
    var Models;
    (function (Models) {
        class Me {
            get Username() {
                return localStorage["Lettuce-Username"];
            }
            set Username(Name) {
                localStorage["Lettuce-Username"] = Name;
            }
            get DisplayName() {
                return document.getElementById("inputMyDisplayName").value;
            }
            set DisplayName(Name) {
                document.getElementById("inputMyDisplayName").value = Name;
            }
            get AuthenticationToken() {
                return localStorage["Lettuce-AuthenticationToken"];
            }
            set AuthenticationToken(Token) {
                localStorage["Lettuce-AuthenticationToken"] = Token;
            }
            ClearCreds() {
                Lettuce.Me.AuthenticationToken = null;
                Lettuce.Me.DisplayName = null;
                Lettuce.Me.Username = null;
            }
        }
        Models.Me = Me;
    })(Models = Lettuce.Models || (Lettuce.Models = {}));
})(Lettuce || (Lettuce = {}));
//# sourceMappingURL=me.js.map