namespace Lettuce.Models {
    export class Me {
        get Username(): string {
            return localStorage["Lettuce-Username"]; 
        }
        set Username(Name: string) {
            localStorage["Lettuce-Username"] = Name;
        }
        get DisplayName(): string {
            return (document.getElementById("inputMyDisplayName") as HTMLInputElement).value;
        }
        set DisplayName(Name: string) {
            (document.getElementById("inputMyDisplayName") as HTMLInputElement).value = Name;
        }
        get AuthenticationToken(): string {
            return localStorage["Lettuce-AuthenticationToken"];
        }
        set AuthenticationToken(Token:string) {
            localStorage["Lettuce-AuthenticationToken"] = Token;
        }
        ClearCreds() {
            Lettuce.Me.AuthenticationToken = null;
            Lettuce.Me.DisplayName = null;
            Lettuce.Me.Username = null;
        }
    }
}