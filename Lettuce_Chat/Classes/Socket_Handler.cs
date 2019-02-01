using Lettuce_Chat.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO;
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
        private List<ArraySegment<byte>> SendBuffer { get; set; } = new List<ArraySegment<byte>>();

        public async Task HandleSocket(HttpContext context, WebSocket ws)
        {
            try
            {
                AllSockets.Add(this);
                Socket = ws;
                var buffer = new byte[1024 * 10];
                WebSocketReceiveResult result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                await ParseMessage(result, buffer);
                while (!Socket.CloseStatus.HasValue)
                {
                    buffer = new byte[1024 * 10];
                    result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                    await ParseMessage(result, buffer);
                }
                if (AllSockets.Contains(this))
                {
                    AllSockets.Remove(this);
                }
                if (CurrentChat != null)
                {
                    await LeaveChat(CurrentChat);
                    await SendUserListUpdate(CurrentChat);
                }
                await ws.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
            }
            catch (Exception Ex)
            {
                if (AllSockets.Contains(this))
                {
                    AllSockets.Remove(this);
                }
                if (CurrentChat != null)
                {
                    await LeaveChat(CurrentChat);
                    await SendUserListUpdate(CurrentChat);
                }
                Utilities.WriteToLog(Ex);
            }
        }
        public async Task SendJSON(dynamic json)
        {
            var jsonRequest = JsonConvert.SerializeObject(json);
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
        public async Task<bool> AuthenticateUser(User authUser, dynamic jsonMessage)
        {
            if (authUser == null)
            {
                jsonMessage.Status = "not found";
                await SendJSON(jsonMessage);
                return false;
            }
            
            if (authUser.BadLoginAttempts >= 3)
            {
                if (DateTime.Now - authUser.LastBadLogin > TimeSpan.FromMinutes(10))
                {
                    authUser.BadLoginAttempts = 0;
                    authUser.Save();
                }
                else
                {
                    jsonMessage.Status = "locked";
                    await SendJSON(JsonConvert.SerializeObject(jsonMessage));
                    return false;
                }
            }
            while (authUser.AuthenticationTokens.Count > 10)
            {
                authUser.AuthenticationTokens.RemoveAt(0);
            }
            if ((jsonMessage as ExpandoObject).Any(prop => prop.Key == "Password"))
            {
                var hasher = new PasswordHasher<User>();
                if (hasher.VerifyHashedPassword(authUser, authUser.Password ?? "", jsonMessage.Password) == PasswordVerificationResult.Failed)
                {
                    authUser.BadLoginAttempts++;
                    authUser.LastBadLogin = DateTime.Now;
                    authUser.Save();
                    jsonMessage.Status = "invalid";
                    await SendJSON(jsonMessage);
                    return false;
                }
                else
                {
                    authUser.AuthenticationTokens.Add(Guid.NewGuid().ToString());
                    authUser.Save();
                    CurrentUser = authUser;
                    return true;
                }
            }
            if (!authUser.AuthenticationTokens.Contains((string)jsonMessage.AuthenticationToken))
            {
                jsonMessage.Status = "expired";
                await SendJSON(jsonMessage);
                return false;
            }
            authUser.AuthenticationTokens.Remove(jsonMessage.AuthenticationToken);
            authUser.AuthenticationTokens.Add(Guid.NewGuid().ToString());
            authUser.Save();
            CurrentUser = authUser;
            return true;
        }
        public List<Chat> GetChatList()
        {
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
            return chatList;
        }
        public async Task LeaveChat(Chat chatLeft)
        {
            var sockets = AllSockets.FindAll(sock => sock?.CurrentChat?.ChatID == chatLeft.ChatID);
            var request = new
            {
                Type = "UserLeft",
                DisplayName = CurrentUser.DisplayName
            };
            foreach (var socket in sockets)
            {
                await socket.SendJSON(request);
            }
        }
        public async Task JoinChat(Chat chatJoin)
        {
            var sockets = AllSockets.FindAll(sock => sock?.CurrentChat?.ChatID == chatJoin.ChatID);
            var request = new
            {
                Type = "UserJoined",
                DisplayName = CurrentUser.DisplayName
            };
            foreach (var socket in sockets)
            {
                await socket.SendJSON(request);
            }
            
        }
        public async Task SendUserListUpdate(Chat chatUpdate)
        {
            if (chatUpdate?.ChatID == null)
            {
                return;
            }
            var sockets = AllSockets.FindAll(sock => sock?.CurrentChat?.ChatID == chatUpdate.ChatID);
            var userList = new List<string>();
            foreach (var socket in sockets)
            {
                userList.Add(socket.CurrentUser.DisplayName);
            }
            if (userList.Count == 0)
            {
                return;
            }
            var request = new
            {
                Type = "UserListUpdate",
                Users = userList
            };
            foreach (var socket in sockets)
            {
                await socket.SendJSON(request);
            }
        }
        public async Task BroadcastMessage(dynamic message)
        {
            if (CurrentChat?.ChatID == null)
            {
                return;
            }
            var sockets = AllSockets.FindAll(sock => sock?.CurrentChat?.ChatID == CurrentChat.ChatID && sock?.CurrentUser?.Username != CurrentUser.Username);
            var userList = new List<string>();
            foreach (var socket in sockets)
            {
                userList.Add(socket.CurrentUser.DisplayName);
            }
            foreach (var socket in sockets)
            {
                await socket.SendJSON(message);
            }
        }
        public void SendChatHistory(DateTime start)
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Messages"));
            var strPath = Path.Combine(di.FullName, CurrentChat.ChatID + ".txt");
            var messages = new List<Chat_Message>();
            var fs = new FileStream(strPath, FileMode.OpenOrCreate);
            var sr = new StreamReader(fs);
            sr.BaseStream.Position = Math.Max(0, fs.Length - 10000);
            SearchChatHistory(start, fs, sr, messages, false, sr.BaseStream.Position);
        }
        private void SearchChatHistory(DateTime start, FileStream fs, StreamReader sr, List<Chat_Message> messages, bool stopAtZero, long streamPosition)
        {
            var seekDate = DateTime.MaxValue;
            string line = "";
            Chat_Message cm = new Chat_Message();
            if ((sr.BaseStream.Position > 0 || !stopAtZero) && seekDate > start)
            {
                try
                {
                    try
                    {
                        line = sr.ReadLine();
                        cm = JsonConvert.DeserializeObject<Chat_Message>(line);
                    }
                    catch
                    {
                        // If deserialization fails, stream was positioned in mid-line.
                        // It should now be at the start of the next line, and deserialization should work.
                        line = sr.ReadLine();
                        if (!String.IsNullOrWhiteSpace(line))
                        {
                            cm = JsonConvert.DeserializeObject<Chat_Message>(line);
                        }
                        else
                        {
                            return;
                        }
                    }
                    seekDate = cm.TimeStamp;
                    if (seekDate < start)
                    {
                        messages.Add(cm);
                        while (seekDate < start & !sr.EndOfStream)
                        {
                            line = sr.ReadLine();
                            cm = JsonConvert.DeserializeObject<Chat_Message>(line);
                            seekDate = cm.TimeStamp;
                            messages.Add(cm);
                        }
                        var request = new
                        {
                            Type = "GetChatHistory",
                            Messages = messages
                        };
#pragma warning disable
                        SendJSON(request);
                        sr.Dispose();
                        fs.Dispose();
                        return;
#pragma warning restore
                    }
                }
                finally
                {
                    if (sr.BaseStream != null)
                    {
                        sr.BaseStream.Position = Math.Max(0, streamPosition - 10000);
                        sr.DiscardBufferedData();
                        SearchChatHistory(start, fs, sr, messages, true, sr.BaseStream.Position);
                    }
                }
            }
            else
            {
                sr.Dispose();
                fs.Dispose();
            }
        }
        public async Task ParseCommand(string commandString)
        {
            var command = commandString.Replace("/", "").ToLower();
            if (command.StartsWith("delete-account"))
            {
                try
                {
                    File.Delete(Path.Combine(Utilities.RootPath, "Data", "Users", CurrentUser.Username + ".json"));
                    var request = new
                    {
                        Type = "AccountDeleted",
                    };
                    await SendJSON(request);
                    await Socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Account deleted.", CancellationToken.None);
                    await LeaveChat(CurrentChat);
                    await SendUserListUpdate(CurrentChat);
                }
                catch
                {
                    var request = new
                    {
                        Type = "CommandOutput",
                        Output = "Failed to delete account."
                    };
                    await SendJSON(request);
                }
                
            }
            else if (command.StartsWith("leave"))
            {
                CurrentUser.InvitedChats.RemoveAll(chat => chat == CurrentChat?.ChatID);
                CurrentUser.OwnedChats.RemoveAll(chat => chat == CurrentChat?.ChatID);
                var oldChat = CurrentChat;
                CurrentChat = null;
                CurrentUser.Save();
                var request = new
                {
                    Type = "ExitChat"
                };
                await SendJSON(request);
                await LeaveChat(oldChat);
                await SendUserListUpdate(oldChat);
            }
            else if (command.StartsWith("password"))
            {
                try
                {
                    if (command.Trim() == "password")
                    {
                        var request = new
                        {
                            Type = "CommandOutput",
                            Output = "Your password can't be blank."
                        };
                        await SendJSON(request);
                        return;
                    }
                    var newPassword = command.Split(new String[] { "password " }, StringSplitOptions.RemoveEmptyEntries)[0];
                    var hasher = new PasswordHasher<User>();
                    CurrentUser.Password = hasher.HashPassword(CurrentUser, newPassword);
                    CurrentUser.Save();
                    var request2 = new
                    {
                        Type = "CommandOutput",
                        Output = "Your password has been changed."
                    };
                    await SendJSON(request2);
                }
                catch
                {
                    var request = new
                    {
                        Type = "CommandOutput",
                        Output = "Failed to set the new password.",
                    };
                    await SendJSON(request);
                }
               
            }
            else
            {
                var request = new
                {
                    Type = "CommandOutput",
                    Output = "Available Commands:<br/>/delete-account = Delete your account permanently.<br/>/leave = Remove yourself as a member or admin from the current chat.<br/>/password [new password] = Change your password."
                };
                await SendJSON(request);
            }
        }
        public async Task ParseMessage(WebSocketReceiveResult result, byte[] buffer)
        {
            if (!result.EndOfMessage)
            {
                return;
            }
            if (result.MessageType == WebSocketMessageType.Text)
            {
                var trimmedString = Encoding.UTF8.GetString(Utilities.TrimBytes(buffer));
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
                                IsMemberOnly = false
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
                            await JoinChat(this.CurrentChat);
                            await SendUserListUpdate(this.CurrentChat);
                            break;
                        }
                    case "TryResumeLogin":
                        {
                            var user = User.Load((string)jsonMessage.Username);
                            if (await AuthenticateUser(user, jsonMessage) == false)
                            {
                                return;
                            }
                            CurrentUser = user;
                            var chatList = GetChatList();
                            var request = new
                            {
                                Type = "TryResumeLogin",
                                Status = "ok",
                                DisplayName = CurrentUser.DisplayName,
                                AccountType = CurrentUser.AccountType,
                                Chats = chatList,
                                AuthenticationToken = CurrentUser.AuthenticationTokens.Last()
                            };
                            await SendJSON(request);
                            break;
                        }
                    case "JoinChat":
                        {
                            Chat chat = Chat.Load(jsonMessage.ChatID);
                            var user = User.Load((string)jsonMessage.Username);
                            if (chat == null)
                            {
                                jsonMessage.Status = "not found";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            if (user == null)
                            {
                                var displayName = Utilities.GetRandomUserName();
                                CurrentUser = new User()
                                {
                                    Username = User.GetNewUsername(),
                                    DisplayName = displayName,
                                    AccountType = Utilities.Permanence.Temporary
                                };
                                CurrentUser.AuthenticationTokens.Add(Guid.NewGuid().ToString());
                            }
                            else
                            {
                                if (await AuthenticateUser(user, jsonMessage) == false)
                                {
                                    return;
                                }
                            }
                            if (chat.IsMemberOnly && chat.OwnerName != CurrentUser.Username && !chat.MemberList.Contains(CurrentUser.Username) && !chat.AdminList.Contains(CurrentUser.Username))
                            {
                                jsonMessage.Status = "unauthorized";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            CurrentChat = chat;
                            CurrentUser.InvitedChats.Add(chat.ChatID);
                            CurrentUser.Save();
                            CurrentChat.Save();
                            var chatList = GetChatList();
                            var request = new
                            {
                                Type = "JoinChat",
                                Status = "ok",
                                DisplayName = CurrentUser.DisplayName,
                                AccountType = CurrentUser.AccountType,
                                Username = CurrentUser.Username,
                                Chats = chatList,
                                Chat = chat,
                                AuthenticationToken = CurrentUser.AuthenticationTokens.Last()
                            };
                            await SendJSON(request);
                            await JoinChat(chat);
                            await SendUserListUpdate(chat);
                            SendChatHistory(DateTime.Now);
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
                            if (chat.IsMemberOnly && chat.OwnerName != CurrentUser.Username && !chat.MemberList.Contains(CurrentUser.Username) && !chat.AdminList.Contains(CurrentUser.Username))
                            {
                                jsonMessage.Status = "unauthorized";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            var oldChat = CurrentChat;
                            if (oldChat != null)
                            {
                                await LeaveChat(oldChat);
                            }
                            CurrentChat = chat;
                            jsonMessage.Status = "ok";
                            jsonMessage.ChatName = chat.ChatName;
                            await SendJSON(jsonMessage);
                            await JoinChat(CurrentChat);
                            if (oldChat != null)
                            {
                                await SendUserListUpdate(oldChat);
                            }
                            await SendUserListUpdate(CurrentChat);
                            SendChatHistory(DateTime.Now);
                            break;
                        }
                    case "NewChat":
                        {
                            if (CurrentUser == null)
                            {
                                return;
                            }
                            var newChat = new Chat()
                            {
                                ChatID = Chat.GetNewID(),
                                ChatName = Utilities.GetRandomChatName(),
                                OwnerName = CurrentUser.Username,
                                ChatType = CurrentUser.AccountType,
                                IsMemberOnly = false
                            };
                            CurrentUser.OwnedChats.Add(newChat.ChatID);
                            newChat.Save();
                            CurrentUser.Save();
                            CurrentChat = newChat;
                            jsonMessage.Status = "ok";
                            jsonMessage.Chat = newChat;
                            await SendJSON(jsonMessage);
                            break;
                        }
                    case "ChatMessage":
                        {
                            string unencoded = Encoding.UTF8.GetString(Convert.FromBase64String(jsonMessage.Message));
                            if (unencoded.StartsWith("/"))
                            {
                                await ParseCommand(unencoded);
                                return;
                            }
                            jsonMessage.TimeStamp = DateTime.Now;
                            jsonMessage.DisplayName = CurrentUser.DisplayName;
                            jsonMessage.Username = CurrentUser.Username;
                            await BroadcastMessage(jsonMessage);
                            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Messages"));
                            var strPath = Path.Combine(di.FullName, CurrentChat.ChatID + ".txt");
                            var cm = new Chat_Message()
                            {
                                Username = CurrentUser.Username,
                                DisplayName = CurrentUser.DisplayName,
                                Message = jsonMessage.Message,
                                TimeStamp = DateTime.Now
                            };
                            File.AppendAllText(strPath, JsonConvert.SerializeObject(cm) + Environment.NewLine);
                            break;
                        }
                    case "FileTransfer":
                        {
                            jsonMessage.TimeStamp = DateTime.Now;
                            jsonMessage.DisplayName = CurrentUser.DisplayName;
                            jsonMessage.Username = CurrentUser.Username;
                            await BroadcastMessage(jsonMessage);
                            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Messages"));
                            var strPath = Path.Combine(di.FullName, CurrentChat.ChatID + ".txt");
                            var cm = new Chat_Message()
                            {
                                Username = CurrentUser.Username,
                                DisplayName = CurrentUser.DisplayName,
                                Message = jsonMessage.URL,
                                TimeStamp = DateTime.Now
                            };
                            File.AppendAllText(strPath, JsonConvert.SerializeObject(cm) + Environment.NewLine);
                            break;
                        }
                    case "Typing":
                        {
                            await BroadcastMessage(jsonMessage);
                            break;
                        }
                    case "UpdateDisplayName":
                        {
                            if (CurrentUser == null)
                            {
                                return;
                            }
                            if (jsonMessage.DisplayName.Length == 0)
                            {
                                jsonMessage.Status = "blank";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            if (jsonMessage.DisplayName.Length > 20)
                            {
                                jsonMessage.Status = "too long";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            CurrentUser.DisplayName = jsonMessage.DisplayName;
                            jsonMessage.Status = "ok";
                            await SendJSON(jsonMessage);
                            await SendUserListUpdate(CurrentChat);
                            CurrentUser.Save();
                            break;
                        }
 
                    case "GetChatInfo":
                        {
                            Chat chat = Chat.Load(jsonMessage.ChatID);
                            if (chat == null)
                            {
                                jsonMessage.Status = "not found";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            if (chat.OwnerName != CurrentUser.Username && !chat.AdminList.Contains(CurrentUser.Username))
                            {
                                jsonMessage.Status = "unauthorized";
                                await SendJSON(jsonMessage);
                                return;
                            }
                            jsonMessage.Status = "ok";
                            jsonMessage.Chat = chat;
                            await SendJSON(jsonMessage);
                            break;
                        }
                    case "AddMember":
                        {
                            Chat chat = Chat.Load(jsonMessage.ChatID);
                            if (chat == null)
                            {
                                return;
                            }
                            if (chat.OwnerName != CurrentUser.Username && !chat.AdminList.Contains(CurrentUser.Username))
                            {
                                return;
                            }
                            if (!User.Exists(jsonMessage.Username))
                            {
                                jsonMessage.Status = "not found";
                            }
                            else
                            {
                                jsonMessage.Status = "ok";
                            }
                            await SendJSON(jsonMessage);
                            break;
                        }
                    case "AddAdmin":
                        {
                            Chat chat = Chat.Load(jsonMessage.ChatID);
                            if (chat == null)
                            {
                                return;
                            }
                            if (chat.OwnerName != CurrentUser.Username && !chat.AdminList.Contains(CurrentUser.Username))
                            {
                                return;
                            }
                            if (!User.Exists(jsonMessage.Username))
                            {
                                jsonMessage.Status = "not found";
                            }
                            else
                            {
                                jsonMessage.Status = "ok";
                            }
                            await SendJSON(jsonMessage);
                            break;
                        }
                    case "SaveChatEdit":
                        {
                            Chat chat = Chat.Load(jsonMessage.ChatID);
                            if (chat == null)
                            {
                                return;
                            }
                            if (chat.OwnerName != CurrentUser.Username && !chat.AdminList.Contains(CurrentUser.Username))
                            {
                                return;
                            }
                            string chatName = jsonMessage.ChatName;
                            if (chatName.Length > 20)
                            {
                                chatName = chatName.Substring(0, 20);
                            }
                            chat.ChatName = chatName;
                            var members = new List<string>();
                            foreach (var member in jsonMessage.Members)
                            {
                                members.Add(member.ToString());
                            }
                            chat.MemberList = members;
                            var admins = new List<string>();
                            foreach (var admin in jsonMessage.Admins)
                            {
                                admins.Add(admin.ToString());
                            }
                            chat.AdminList = admins;
                            chat.IsMemberOnly = jsonMessage.MemberOnly;
                            chat.Save();
                            var request = new
                            {
                                Type = "ChatUpdated",
                                ChatID = chat.ChatID,
                                ChatName = chat.ChatName
                            };
                            var sockets = AllSockets.FindAll(sock => sock?.CurrentUser?.InvitedChats?.Contains(chat.ChatID) == true || sock?.CurrentUser?.OwnedChats?.Contains(chat.ChatID) == true || sock?.CurrentUser?.Username == chat.OwnerName);
                            foreach (var socket in sockets)
                            {
                                await socket.SendJSON(request);
                            }
                            break;
                        }
                    case "LoginCheckUser":
                        {
                            jsonMessage.Status = User.Exists(jsonMessage.Username);
                            await SendJSON(jsonMessage);
                            break;
                        }
                    case "LoginExistingUser":
                        {
                            if (!User.Exists(jsonMessage.Username))
                            {
                                return;
                            }
                            var user = User.Load(jsonMessage.Username);
                            if (await AuthenticateUser(user, jsonMessage) == false)
                            {
                                return;
                            }
                            
                            var request = new
                            {
                                Type = "LoginExistingUser",
                                Status = "ok",
                                AuthenticationToken = CurrentUser.AuthenticationTokens.Last(),
                                DisplayName = CurrentUser.DisplayName,
                                AccountType = CurrentUser.AccountType,
                                Username = CurrentUser.Username,
                                Chats = GetChatList()
                            };
                            await SendJSON(request);
                            break;
                        }
                    case "LoginNewUser":
                        {
                            foreach (var badChar in Path.GetInvalidPathChars())
                            {
                                if ((jsonMessage.Username as string).Contains(badChar))
                                {
                                    jsonMessage.Status = "invalid";
                                    await SendJSON(jsonMessage);
                                    return;
                                }
                            }
                            if (jsonMessage.Username.Length > 20)
                            {
                                return;
                            }
                            if (User.Exists(jsonMessage.Username))
                            {
                                return;
                            }
                            if (jsonMessage.Password != jsonMessage.Confirm)
                            {
                                return;
                            }
                            var hasher = new PasswordHasher<User>();
                            CurrentUser = new User()
                            {
                                Username = jsonMessage.Username,
                                DisplayName = Utilities.GetRandomUserName(),
                                AccountType = Utilities.Permanence.Permanent
                            };
                            CurrentUser.Password = hasher.HashPassword(CurrentUser, jsonMessage.Password);
                            CurrentUser.AuthenticationTokens.Add(Guid.NewGuid().ToString());
                            CurrentChat = new Chat()
                            {
                                ChatID = Chat.GetNewID(),
                                OwnerName = CurrentUser.Username,
                                ChatName = Utilities.GetRandomChatName(),
                                ChatType = Utilities.Permanence.Permanent,
                                IsMemberOnly = false
                            };
                            CurrentChat.Save();
                            CurrentUser.OwnedChats.Add(CurrentChat.ChatID);
                            var request = new
                            {
                                Type = "LoginNewUser",
                                Status = "ok",
                                AuthenticationToken = CurrentUser.AuthenticationTokens.Last(),
                                DisplayName = CurrentUser.DisplayName,
                                Username = CurrentUser.Username,
                                AccountType = CurrentUser.AccountType,
                                Chats = GetChatList()
                            };
                            CurrentUser.Save();
                            await SendJSON(request);
                            break;
                        }
                    case "GetChatHistory":
                        {
                            SendChatHistory(jsonMessage.Start.ToLocalTime());
                            break;
                        }
                    case "DeleteChat":
                        {
                            if (!Chat.Exists(jsonMessage.ChatID))
                            {
                                return;
                            }
                            Chat chat = Chat.Load(jsonMessage.ChatID);
                            if (chat.OwnerName != CurrentUser.Username && !chat.AdminList.Contains(CurrentUser.Username))
                            {
                                return;
                            }
                            if (Chat.Delete(jsonMessage.ChatID))
                            {
                                jsonMessage.Status = "ok";
                                foreach (var socket in AllSockets.FindAll(sock=>sock?.CurrentChat?.ChatID == jsonMessage.ChatID))
                                {
                                    await socket.SendJSON(jsonMessage);
                                }
                            }
                            else
                            {
                                jsonMessage.Status = "failed";
                                await SendJSON(jsonMessage);
                            }
                            break;
                        }
                    default:
                        {
                            break;
                        }
                }
            }
            else if (result.MessageType == WebSocketMessageType.Binary)
            {

            }
            else if (result.MessageType == WebSocketMessageType.Close)
            {

            }
        }
    }
}
