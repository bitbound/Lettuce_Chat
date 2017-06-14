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
        }
        Models.Me = Me;
    })(Models = Lettuce.Models || (Lettuce.Models = {}));
})(Lettuce || (Lettuce = {}));
//# sourceMappingURL=me.js.map