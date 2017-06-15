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
        public List<string> MemberList { get; set; } = new List<string>();
        public List<string> AdminList { get; set; } = new List<string>();
        public bool IsMemberOnly { get; set; }
        public Utilities.Permanence ChatType { get; set; }
        public void Save()
        {
            MemberList = MemberList.Distinct().ToList();
            AdminList = AdminList.Distinct().ToList();
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
        public static bool Delete(string ChatID)
        {
            try
            {
                var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Chats"));
                File.Delete(Path.Combine(di.FullName, ChatID + ".json"));
                var di2 = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Messages", "Chats"));
                File.Delete(Path.Combine(di2.FullName, ChatID + ".txt"));
                return true;
            }
            catch
            {
                return false;
            }
        }
        public static bool Exists(string ChatID)
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Chats"));
            return File.Exists(Path.Combine(di.FullName, ChatID + ".json"));
        }
        public static string GetNewID()
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Chats"));
            var id = Path.GetRandomFileName().Replace(".", "").ToLower();
            while (File.Exists(Path.Combine(di.FullName, id + ".json")))
            {
                id = Path.GetRandomFileName().Replace(".", "").ToLower();
            }
            return id;
        }
    }
}
