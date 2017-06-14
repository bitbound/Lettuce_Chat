using Lettuce_Chat.Classes;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Lettuce_Chat.Models
{
    public class Chat
    {
        public string ChatName { get; set; }
        public string ChatID { get; set; }
        public string OwnerName { get; set; }
        public List<string> UserList { get; set; } = new List<string>();
        public List<string> AdminList { get; set; } = new List<string>();
        public bool IsInviteOnly { get; set; }
        public Utilities.Permanence ChatType { get; set; }
        public void Save()
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Chats"));
            File.WriteAllText(Path.Combine(di.FullName, ChatID + ".json"), JsonConvert.SerializeObject(this));
        }
        public static Chat Load(string ChatID)
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Chats"));
            if (File.Exists(Path.Combine(di.FullName, ChatID + ".json")))
            {
                return JsonConvert.DeserializeObject<Chat>(File.ReadAllText(Path.Combine(di.FullName, ChatID + ".json")));
            }
            else
            {
                return null;
            }
        }
        public static string GetNewID()
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Chats"));
            var id = Guid.NewGuid().ToString().Replace("-", "");
            while (File.Exists(Path.Combine(di.FullName, id + ".json")))
            {
                id = Guid.NewGuid().ToString().Replace("-", "");
            }
            return id;
        }
    }
}
