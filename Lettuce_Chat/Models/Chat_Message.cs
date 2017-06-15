using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Lettuce_Chat.Models
{
    public class Chat_Message
    {
        public string Username { get; set; }
        public DateTime TimeStamp { get; set; }
        public string DisplayName { get; set; }
        public string Message { get; set; }
    }
}
