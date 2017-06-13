using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Lettuce_Chat.Models
{
    public class User
    {
        public string Username { get; set; }
        public List<string> OwnedChats { get; set; } = new List<string>();
        public List<string> InvitedChats { get; set; } = new List<string>();
    }
}
