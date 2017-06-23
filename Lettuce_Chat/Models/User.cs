using Lettuce_Chat.Classes;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Lettuce_Chat.Models
{
    public class User
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string DisplayName { get; set; }
        public Utilities.Permanence AccountType { get; set; }
        public List<string> AuthenticationTokens { get; set; } = new List<string>();
        public List<string> OwnedChats { get; set; } = new List<string>();
        public List<string> InvitedChats { get; set; } = new List<string>();
        public int BadLoginAttempts { get; set; } = 0;
        public DateTime LastBadLogin { get; set; }
        public void Save()
        {
            InvitedChats = InvitedChats.Distinct().ToList();
            OwnedChats = OwnedChats.Distinct().ToList();
            InvitedChats.RemoveAll(chat => !Chat.Exists(chat));
            OwnedChats.RemoveAll(chat => !Chat.Exists(chat));
            InvitedChats.RemoveAll(chat => OwnedChats.Contains(chat));
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Users"));
            File.WriteAllText(Path.Combine(di.FullName, Username + ".json"), JsonConvert.SerializeObject(this));
        }
        public static User Load(string Username)
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Users"));
            if (File.Exists(Path.Combine(di.FullName, Username + ".json")))
            {
                return JsonConvert.DeserializeObject<User>(File.ReadAllText(Path.Combine(di.FullName, Username + ".json")));
            }
            else
            {
                return null;
            }
        }
        public static bool Exists(string Username)
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Users"));
            return File.Exists(Path.Combine(di.FullName, Username + ".json"));
        }
        public static string GetNewUsername()
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Users"));
            var userName = (Path.GetRandomFileName() + Path.GetRandomFileName()).Replace(".", "").ToLower();
            while (File.Exists(Path.Combine(di.FullName, userName + ".json")))
            {
                userName = (Path.GetRandomFileName() + Path.GetRandomFileName()).Replace(".", "").ToLower();
            }
            return userName;
        }
    }
}
