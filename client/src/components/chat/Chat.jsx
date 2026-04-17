import { useContext, useEffect, useMemo, useRef, useState } from "react"
import "./chat.scss"
import { AuthContext } from "../../context/AuthContext"
import apiRequest from "../../lib/apiRequest"
import {format} from "timeago.js"
import { SocketContext } from "../../context/SocketContext"
import { useNotificationStore } from "../../lib/notificationStore"

function Chat({ chats, initialChatId = "" }) {
    const [chatList, setChatList] = useState(chats || []);
    const [chat,setChat] = useState(null)
    const [query, setQuery] = useState("");
    const [sending, setSending] = useState(false);
    const [deletingChat, setDeletingChat] = useState(false);
    const {currentUser} = useContext(AuthContext)
    const {socket, onlineUsers} = useContext(SocketContext)

    const messageEndRef = useRef()
    const openedFromQueryRef = useRef(false);

    const decrease = useNotificationStore(state=>state.decrease);

    useEffect(() => {
        setChatList(chats || []);
    }, [chats]);

    useEffect(()=>{
        messageEndRef.current?.scrollIntoView({behavior:"smooth"})
    },[chat?.messages?.length])

    const handleOpenChat = async(id,receiver) => {
        try {
            const res = await apiRequest("/chats/"+id);

            if(!res.data.seenBy.includes(currentUser.id)) {
                decrease();
            }

            setChat({...res.data,receiver});
            setChatList((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? { ...item, seenBy: Array.from(new Set([...(item.seenBy || []), currentUser.id])) }
                        : item
                )
            );
        }
        catch(err) {
            console.log(err)
        }
    }

    useEffect(() => {
        if (!initialChatId || openedFromQueryRef.current || !chatList.length) return;

        const target = chatList.find((item) => item.id === initialChatId);
        if (!target) return;

        openedFromQueryRef.current = true;
        handleOpenChat(target.id, target.receiver);
    }, [initialChatId, chatList]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const text = formData.get("text")?.toString().trim();

        if(!text) return;
        if(!chat?.receiver?.id) return;

        setSending(true);

        try{
            const res = await apiRequest.post("/messages/" + chat.id,{text});
            setChat(prev => ({...prev,messages:[...prev.messages,res.data]}));
            setChatList((prev) =>
                prev.map((item) =>
                    item.id === chat.id
                        ? {
                            ...item,
                            lastMessage: res.data.text,
                            seenBy: Array.from(new Set([...(item.seenBy || []), currentUser.id])),
                        }
                        : item
                )
            );
            e.target.reset();

            socket?.emit("sendMessage",{
                receiverId:chat.receiver.id,
                data: res.data,
            })
        }
        catch(err) {
            console.log(err)
        } finally {
            setSending(false);
        }
    }

    const handleDeleteChat = async () => {
        if (!chat?.id) return;

        const confirmed = window.confirm("Delete this conversation permanently?");
        if (!confirmed) return;

        setDeletingChat(true);

        try {
            await apiRequest.delete(`/chats/${chat.id}`);
            setChatList((prev) => prev.filter((item) => item.id !== chat.id));
            setChat(null);
        } catch (err) {
            console.log(err);
        } finally {
            setDeletingChat(false);
        }
    }

    useEffect(()=>{
        if (!socket) return;

        socket.on("getMessage",(data)=>{
            setChatList((prev) =>
                prev.map((item) => {
                    if (item.id !== data.chatId) return item;

                    const nextSeenBy = chat?.id === data.chatId
                        ? Array.from(new Set([...(item.seenBy || []), currentUser.id]))
                        : item.seenBy || [];

                    return {
                        ...item,
                        lastMessage: data.text,
                        seenBy: nextSeenBy,
                    };
                })
            );

            if(chat?.id === data.chatId) {
                setChat((prev)=>({...prev,messages:[...prev.messages,data]}));
                apiRequest.put("/chats/read/"+ data.chatId).catch((err) => console.log(err));
            }
        })

        return () => {
            socket.off("getMessage");
        };
    },[socket,chat?.id,currentUser?.id])

    const sortedChats = useMemo(() => {
        return [...chatList].sort((a, b) => {
            const aSeen = a?.seenBy?.includes(currentUser.id);
            const bSeen = b?.seenBy?.includes(currentUser.id);
            if (aSeen !== bSeen) return aSeen ? 1 : -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [chatList, currentUser.id]);

    const filteredChats = useMemo(() => {
        const text = query.trim().toLowerCase();
        if (!text) return sortedChats;

        return sortedChats.filter((item) => {
            const username = item?.receiver?.username?.toLowerCase() || "";
            const lastMessage = item?.lastMessage?.toLowerCase() || "";
            return username.includes(text) || lastMessage.includes(text);
        });
    }, [query, sortedChats]);

    return(
        <div className="chat">
            <div className="messages">
                <div className="messagesHeader">
                    <h1>Messages</h1>
                    <span className="chatCount">{sortedChats.length}</span>
                </div>

                <div className="searchBox">
                    <input
                        type="text"
                        placeholder="Search chats"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {!filteredChats.length && <p className="emptyList">No chats found.</p>}

                {
                    filteredChats?.map((c)=>(
                        <div className={`message ${chat?.id === c.id ? "active" : ""}`} key={c.id} style={{backgroundColor: c.seenBy?.includes(currentUser.id) || chat?.id === c.id ? "white" : "#dbeeff"}}
                            onClick={()=>handleOpenChat(c.id,c.receiver)}
                        >
                            <img src={c.receiver.avatar || "/noavatar.jpg"} alt="" />
                            <div className="preview">
                                <span>
                                    {c.receiver.username}
                                    {/* {onlineUsers.includes(c.receiver?.id) && <em className="onlineDot">Online</em>} */}
                                </span>
                                <p>{c.lastMessage || "Start your conversation"}</p>
                            </div>
                            {!c.seenBy?.includes(currentUser.id) && <em className="unreadBadge">New</em>}
                        </div>
                    ))
                }

            </div>
            {chat ? ( <div className="chatBox">
                <div className="top">
                    <div className="user">
                        <img src={chat.receiver.avatar || "/noavatar.jpg"} alt="" />
                        {chat.receiver.username}
                    </div>
                    <div className="chatActions">
                        <button
                            type="button"
                            className="deleteChatBtn"
                            onClick={handleDeleteChat}
                            disabled={deletingChat}
                        >
                            {deletingChat ? "Deleting..." : "Delete Chat"}
                        </button>
                        <span className="close" onClick={()=>setChat(null)}>X</span>
                    </div>
                </div>
                <div className="center">
                    {
                        chat.messages.map(message=>(
                            <div className="chatMessage"
                            style={{
                                alignSelf:message.userId === currentUser.id ? "flex-end" : "flex-start",
                                textAlign:message.userId === currentUser.id ? "right" : "left",
                            }}
                            
                            key={message.id}>
                                <p>{message.text}</p>
                                <span>{format(message.createdAt)}</span>
                            </div> 
                        ))
                    }
                    <div ref={messageEndRef}></div>
                </div>
                <form onSubmit={handleSubmit} className="bottom">
                    <div className="composerInput">
                        <textarea name="text" placeholder="Write a message..."></textarea>
                    </div>
                    <button className="sendButton" disabled={sending}>
                        <span>{sending ? "Sending..." : "Send"}</span>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 20l18-8L3 4v6l12 2-12 2v6z" />
                        </svg>
                    </button>
                </form>
            </div>) : (
                <div className="chatPlaceholder">
                    <h3>Select a conversation</h3>
                    <p>Choose any chat from the list to view messages and start texting.</p>
                </div>
            )}
        </div>
    )
}

export default Chat