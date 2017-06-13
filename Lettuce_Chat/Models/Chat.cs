using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Lettuce_Chat.Models
{
    public class Chat
    {
        public string ChatName { get; set; }
        public string ChatID { get; set; }
        public List<string> UserList { get; set; } = new List<string>();
        public List<string> AdminList { get; set; } = new List<string>();
        public bool IsMemberOnly { get; set; }
    }
}
