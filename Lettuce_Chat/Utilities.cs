using Microsoft.AspNetCore.Hosting;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Lettuce_Chat
{
    public static class Utilities
    {
        public static void WriteToLog(string Message, IHostingEnvironment HostEnv)
        {
            var entry = new
            {
                Type = "Info",
                Timestamp = DateTime.Now,
                Message = Message
            };
            File.WriteAllText(JsonConvert.SerializeObject(entry) + Environment.NewLine, HostEnv.ContentRootPath + $@"\Logs\{DateTime.Now.Year}\{DateTime.Now.Month}\{DateTime.Now.Day}.txt");
        }
        public static void WriteToLog(Exception Ex, IHostingEnvironment HostEnv)
        {
            var exception = Ex;
            while (exception != null)
            {
                var entry = new
                {
                    Type = "Error",
                    Timestamp = DateTime.Now,
                    Message = exception.Message,
                    Source = exception.Source,
                    Stack = exception.StackTrace
                };
                File.WriteAllText(JsonConvert.SerializeObject(entry) + Environment.NewLine, HostEnv.ContentRootPath + $@"\Logs\{DateTime.Now.Year}\{DateTime.Now.Month}\{DateTime.Now.Day}.txt");
                exception = exception.InnerException;
            }
            
        }
    }
}
