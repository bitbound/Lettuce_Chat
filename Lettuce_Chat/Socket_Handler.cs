using Lettuce_Chat.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Lettuce_Chat
{
    // Class based on documentation at https://docs.microsoft.com/en-us/aspnet/core/fundamentals/websockets
    public class Socket_Handler
    {
        public static List<Socket_Handler> AllSockets { get; set; } = new List<Socket_Handler>();

        public User User { get; set; }
        public WebSocket Socket { get; set; }
        public IHostingEnvironment HostEnv { get; set; }
        private List<ArraySegment<byte>> SendBuffer { get; set; } = new List<ArraySegment<byte>>();


        public Socket_Handler(IHostingEnvironment Env)
        {
            this.HostEnv = Env;
        }


        public void AddHandler(IApplicationBuilder App, string RequestPath)
        {
            App.Use(async (context, next) =>
            {
                if (context.Request.Path == RequestPath)
                {
                    if (context.WebSockets.IsWebSocketRequest)
                    {
                        WebSocket webSocket = await context.WebSockets.AcceptWebSocketAsync();
                        await HandleSocket(context, webSocket);
                    }
                    else
                    {
                        context.Response.StatusCode = 400;
                    }
                }
                else
                {
                    await next();
                }

            });
        }
        public async Task HandleSocket(HttpContext Context, WebSocket WS)
        {
            try
            {
                AllSockets.Add(this);
                Socket = WS;
                var buffer = new byte[1024 * 10];
                WebSocketReceiveResult result = await WS.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                while (!Socket.CloseStatus.HasValue)
                {
                    result = await WS.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                    ParseMessage(result, buffer);
                }
                if (AllSockets.Contains(this))
                {
                    AllSockets.Remove(this);
                }
                await WS.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
            }
            catch (Exception Ex)
            {
                if (AllSockets.Contains(this))
                {
                    AllSockets.Remove(this);
                }
                Utilities.WriteToLog(Ex, HostEnv);
            }
        }
        public async Task SendJSON(dynamic JsonRequest)
        {
            var jsonRequest = JsonConvert.SerializeObject(JsonRequest);
            var outBuffer = new ArraySegment<byte>(Encoding.UTF8.GetBytes(jsonRequest));
            SendBuffer.Add(outBuffer);
            if (SendBuffer.Count > 1)
            {
                return;
            }
            while (SendBuffer.Count > 0)
            {
                try
                {
                    await Socket.SendAsync(SendBuffer[0], WebSocketMessageType.Text, true, CancellationToken.None);
                    SendBuffer.RemoveAt(0);
                }
                catch (Exception ex)
                {
                    if (AllSockets.Contains(this))
                    {
                        AllSockets.Remove(this);
                    }
                    SendBuffer.Clear();
                    throw ex;
                }
            }
        }
        public void ParseMessage(WebSocketReceiveResult Result, byte[] Buffer)
        {
            if (!Result.EndOfMessage)
            {
                return;
            }
            if (Result.MessageType == WebSocketMessageType.Text)
            {
                
            }
            else if (Result.MessageType == WebSocketMessageType.Binary)
            {

            }
            else if (Result.MessageType == WebSocketMessageType.Close)
            {

            }
        }
    }
}
