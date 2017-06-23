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
                if (CurrentChat != null)
                {
                    await LeaveChat(CurrentChat);
                    await SendUserListUpdate(CurrentChat);
                }
                await WS.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
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
        public async Task<bool> AuthenticateUser(User AuthUser, dynamic JsonMessage)
        {
            if (AuthUser == null)
            {
                JsonMessage.Status = "not found";
                await SendJSON(JsonMessage);
                return false;
            }
            
            if (AuthUser.BadLoginAttempts >= 3)
            {
                if (DateTime.Now - AuthUser.LastBadLogin > TimeSpan.FromMinutes(10))
                {
                    AuthUser.BadLoginAttempts = 0;
                    AuthUser.Save();
                }
                else
                {
                    JsonMessage.Status = "locked";
                    await SendJSON(JsonConvert.SerializeObject(JsonMessage));
                    return false;
                }
            }
            while (AuthUser.AuthenticationTokens.Count > 10)
            {
                AuthUser.AuthenticationTokens.RemoveAt(0);
            }
            if ((JsonMessage as ExpandoObject).Any(prop => prop.Key == "Password"))
            {
                var hasher = new PasswordHasher<User>();
                if (hasher.VerifyHashedPassword(AuthUser, AuthUser.Password ?? "", JsonMessage.Password) == PasswordVerificationResult.Failed)
                {
                    AuthUser.BadLoginAttempts++;
                    AuthUser.LastBadLogin = DateTime.Now;
                    AuthUser.Save();
                    JsonMessage.Status = "invalid";
                    await SendJSON(JsonMessage);
                    return false;
                }
                else
                {
                    AuthUser.AuthenticationTokens.Add(Guid.NewGuid().ToString());
                    AuthUser.Save();
                    CurrentUser = AuthUser;
                    return true;
                }
            }
            if (!AuthUser.AuthenticationTokens.Contains((string)JsonMessage.AuthenticationToken))
            {
                JsonMessage.Status = "expired";
                await SendJSON(JsonMessage);
                return false;
            }
            if (AllSockets.Exists(sock=>sock?.CurrentUser?.Username == AuthUser.Username))
            {
                var existing = AllSockets.Find(sock => sock.CurrentUser.Username == AuthUser.Username);
                var request = new
                {
                    Type = "LoginElsewhere"
                };
                await existing.SendJSON(request);
            }
            AuthUser.AuthenticationTokens.Remove(JsonMessage.AuthenticationToken);
            AuthUser.AuthenticationTokens.Add(Guid.NewGuid().ToString());
            AuthUser.Save();
            CurrentUser = AuthUser;
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
        public async Task LeaveChat(Chat ChatLeft)
        {
            var sockets = AllSockets.FindAll(sock => sock?.CurrentChat?.ChatID == ChatLeft.ChatID);
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
        public async Task JoinChat(Chat ChatJoin)
        {
            var sockets = AllSockets.FindAll(sock => sock?.CurrentChat?.ChatID == ChatJoin.ChatID);
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
        public async Task SendUserListUpdate(Chat ChatUpdate)
        {
            if (ChatUpdate?.ChatID == null)
            {
                return;
            }
            var sockets = AllSockets.FindAll(sock => sock?.CurrentChat?.ChatID == ChatUpdate.ChatID);
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
        public async Task BroadcastMessage(dynamic Message)
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
                await socket.SendJSON(Message);
            }
        }
        public void SendChatHistory(DateTime Start)
        {
            var di = Directory.CreateDirectory(Path.Combine(Utilities.RootPath, "Data", "Messages"));
            var strPath = Path.Combine(di.FullName, CurrentChat.ChatID + ".txt");
            var messages = new List<Chat_Message>();
            var fs = new FileStream(strPath, FileMode.OpenOrCreate);
            var sr = new StreamReader(fs);
            sr.BaseStream.Position = Math.Max(0, fs.Length - 10000);
            SearchChatHistory(Start, fs, sr, messages, false, sr.BaseStream.Position);
        }
        private void SearchChatHistory(DateTime Start, FileStream FS, StreamReader SR, List<Chat_Message> Messages, bool StopAtZero, long StreamPosition)
        {
            var seekDate = DateTime.MaxValue;
            string line = "";
            Chat_Message cm = new Chat_Message();
            if ((SR.BaseStream.Position > 0 || !StopAtZero) && seekDate > Start)
            {
                try
                {
                    try
                    {
                        line = SR.ReadLine();
                        cm = JsonConvert.DeserializeObject<Chat_Message>(line);
                    }
                    catch
                    {
                        // If deserialization fails, stream was positioned in mid-line.
                        // It should now be at the start of the next line, and deserialization should work.
                        line = SR.ReadLine();
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
                    if (seekDate < Start)
                    {
                        Messages.Add(cm);
                        while (seekDate < Start & !SR.EndOfStream)
                        {
                            line = SR.ReadLine();
                            cm = JsonConvert.DeserializeObject<Chat_Message>(line);
                            seekDate = cm.TimeStamp;
                            Messages.Add(cm);
                        }
                        var request = new
                        {
                            Type = "GetChatHistory",
                            Messages = Messages
                        };
#pragma warning disable
                        SendJSON(request);
                        SR.Dispose();
                        FS.Dispose();
                        return;
#pragma warning restore
                    }
                }
                finally
                {
                    if (SR.BaseStream != null)
                    {
                        SR.BaseStream.Position = Math.Max(0, StreamPosition - 10000);
                        SR.DiscardBufferedData();
                        SearchChatHistory(Start, FS, SR, Messages, true, SR.BaseStream.Position);
                    }
                }
            }
            else
            {
                SR.Dispose();
                FS.Dispose();
            }
        }
        public async Task ParseCommand(string Command)
        {
            var command = Command.Replace("/", "").ToLower();
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
            else if (Result.MessageType == WebSocketMessageType.Binary)
            {

            }
            else if (Result.MessageType == WebSocketMessageType.Close)
            {

            }
        }
    }
}
