using Lettuce_Chat.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Lettuce_Chat.Classes
{
    // Class based on documentation at https://docs.microsoft.com/en-us/aspnet/core/fundamentals/websockets
    public class Socket_Handler
    {
        public static List<Socket_Handler> AllSockets { get; set; } = new List<Socket_Handler>();

        public User CurrentUser { get; set; }
        public Chat CurrentChat { get; set; }
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
                await ParseMessage(result, buffer);
                while (!Socket.CloseStatus.HasValue)
                {
                    buffer = new byte[1024 * 10];
                    result = await WS.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                    await ParseMessage(result, buffer);
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
                Utilities.WriteToLog(Ex);
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
        public async Task ParseMessage(WebSocketReceiveResult Result, byte[] Buffer)
        {
            if (!Result.EndOfMessage)
            {
                return;
            }
            if (Result.MessageType == WebSocketMessageType.Text)
            {
                var trimmedString = Encoding.UTF8.GetString(Utilities.TrimBytes(Buffer));
                var expando = JsonConvert.DeserializeObject<ExpandoObject>(trimmedString);
                var jsonMessage = (dynamic)expando;

                switch ((string)jsonMessage.Type)
                {
                    case "GetGuestChat":
                        {
                            var displayName = Utilities.GetRandomUserName();
                            CurrentUser = new User()
                            {
                                Username = User.GetNewUsername(),
                                DisplayName = displayName,
                                AccountType = Utilities.Permanence.Temporary
                            };
                            CurrentUser.AuthenticationTokens.Add(Guid.NewGuid().ToString());
                            CurrentChat = new Chat()
                            {
                                ChatID = Chat.GetNewID(),
                                OwnerName = CurrentUser.Username,
                                ChatName = Utilities.GetRandomChatName(),
                                ChatType = Utilities.Permanence.Temporary,
                                IsInviteOnly = false
                            };
                            CurrentUser.OwnedChats.Add(CurrentChat.ChatID);
                            var request = new
                            {
                                Type = "GetGuestChat",
                                Status = "ok",
                                User = this.CurrentUser,
                                Chat = this.CurrentChat
                            };
                            await SendJSON(request);
                            CurrentUser.Save();
                            CurrentChat.Save();
                            break;
                        }
                    case "TryResumeLogin":
                        {
                            var user = User.Load((string)jsonMessage.Username);
                            if (user == null)
                            {
                                jsonMessage.Status = "not found";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            
                            if (user.BadLoginAttempts >= 3)
                            {
                                if (DateTime.Now - user.LastBadLogin > TimeSpan.FromMinutes(10))
                                {
                                    user.BadLoginAttempts = 0;
                                    user.Save();
                                }
                                else
                                {
                                    jsonMessage.Status = "locked";
                                    await SendJSON(JsonConvert.SerializeObject(jsonMessage));
                                    return;
                                }
                            }
                            
                            if (!user.AuthenticationTokens.Contains((string)jsonMessage.AuthenticationToken))
                            {
                                jsonMessage.Status = "expired";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            CurrentUser = user;
                            List<Chat> chatList = new List<Chat>();
                            foreach (var chatID in CurrentUser.OwnedChats)
                            {
                                var chat = Chat.Load(chatID);
                                if (chat != null)
                                {
                                    chatList.Add(chat);
                                }
                            }
                            foreach (var chatID in CurrentUser.InvitedChats)
                            {
                                var chat = Chat.Load(chatID);
                                if (chat != null)
                                {
                                    chatList.Add(chat);
                                }
                            }
                            var request = new
                            {
                                Type = "TryResumeLogin",
                                Status = "ok",
                                User = CurrentUser,
                                Chats = chatList
                            };
                            await SendJSON(request);
                            break;
                        }
                    case "JoinChat":
                        {
                            
                            break;
                        }
                    case "ChangeChat":
                        {
                            Chat chat = Chat.Load(jsonMessage.ChatID);
                            if (chat == null)
                            {
                                jsonMessage.Status = "not found";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            if (chat.IsInviteOnly && chat.OwnerName != CurrentUser.Username && !chat.UserList.Contains(CurrentUser.Username))
                            {
                                jsonMessage.Status = "unauthorized";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            CurrentChat = chat;
                            jsonMessage.Status = "ok";
                            jsonMessage.ChatName = chat.ChatName;
                            await SendJSON(jsonMessage);
                            break;
                        }
                    case "NewChat":
                        {
                            var newChat = new Chat()
                            {
                                ChatID = Chat.GetNewID(),
                                ChatName = Utilities.GetRandomChatName(),
                                OwnerName = CurrentUser.Username,
                                ChatType = CurrentUser.AccountType,
                                IsInviteOnly = false
                            };
                            CurrentUser.OwnedChats.Add(newChat.ChatID);
                            CurrentUser.Save();
                            newChat.Save();
                            CurrentChat = newChat;
                            jsonMessage.Status = "ok";
                            jsonMessage.Chat = newChat;
                            await SendJSON(jsonMessage);
                            break;
                        }
                    case "GetCurrentUsers":
                        {
                            var userList = new List<string>();
                            foreach (var socket in AllSockets)
                            {
                                if (socket.CurrentChat.ChatID == CurrentChat.ChatID && socket.CurrentUser.Username != CurrentUser.Username)
                                {
                                    userList.Add(socket.CurrentUser.Username);
                                }
                            }
                            jsonMessage.Users = userList;
                            await SendJSON(jsonMessage);
                            break;
                        }
                    default:
                        {
                            break;
                        }
                }
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
