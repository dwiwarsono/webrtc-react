import {
    createContext, useEffect, useState, useReducer
} from "react";
import {useNavigate} from 'react-router-dom';
import Peer from 'peerjs';
import {v4 as uuidV4} from 'uuid';
import { ws } from "../ws";
import { peersReducer } from "../reducers/peerReducers";
import { addPeerAction, removeAction } from "../reducers/peerActions";
import { IMessage } from "../types/chat";
import { chatReducer } from "../reducers/chatReducers";
import { addMessageAction } from "../reducers/chatActions";


export const RoomContext = createContext<null | any>(null);


export const RoomProvider: React.FunctionComponent = ({ children }) => {
    const navigate = useNavigate();
    const [me, setMe] = useState<Peer>();
    const [stream, setStream] = useState<MediaStream>();
    const [screenSharingId, setScreenSharingId] = useState<string>("");
    const [roomId, setRoomId] = useState<string>()
    const [peers, dispatch] = useReducer(peersReducer, {});
    const [chat, chatDispatch] = useReducer(chatReducer, {
        messages: []
    });

    const enterRoom = ({roomId} : {roomId: string}) => {
        console.log({roomId});
        navigate(`/room/${roomId}`)
    }

    const getUsers = ({ participants}: {participants: string[]}) => {
        console.log("PART", participants);
        
    }

    const removePeer = (peerId: string) => {
        dispatch(removeAction(peerId))
    }

    const switchStream = (stream: MediaStream) => {
        setStream(stream);
        setScreenSharingId(me?.id || "");

        Object.values(me?.connections).forEach((connection: any) => {
            const videoTrack = stream?.getTracks().find(track => track.kind === 'video')
            connection[0].peerConnection.getSenders()[1].replaceTrack(videoTrack)
            .catch((err: any) => console.log(err));
        })
    }

    const shareScreen = () => {
        if (screenSharingId) {
            navigator.mediaDevices
            .getUserMedia({video: true, audio: true})
            .then(switchStream)
        } else {
            navigator.mediaDevices.getDisplayMedia({})
            .then(switchStream);
        }
    }

    const sendMessage = (message: string) => {
        const messageData: IMessage = {
            content: message,
            author: me?.id,
            timestamp: new Date().getTime()
        }
        chatDispatch(addMessageAction(messageData))
        ws.emit("send-message", roomId, messageData);
    }

    const addMessage = (message: IMessage) => {
        console.log(message, 'From server');
        chatDispatch(addMessageAction(message))
        
    }

    const addHistoryMessage = (messages: IMessage) => {
        chatDispatch(addMessageAction(messages))
    }

    useEffect(() => {
        const myId = uuidV4();

        const peer = new Peer(myId, { // INI DITAMBAHKAN JIKA MENGGUNAKAN PEER SERVER, BACA README
            host: "localhost",
            port: 9001,
            path: "/"
        })
        // const peer = new Peer(myId)

        setMe(peer);

        try {
            navigator.mediaDevices
            .getUserMedia({ video: true, audio: true})
            .then((stream) => {
                console.log(stream);
                setStream(stream)
            })
        } catch (error) {
            console.log(error);
            
        }

        ws.on("room-created", enterRoom) // INI AKAN MENERIMA RESPONSE KETIKA ROOM DI CREATE
        ws.on("get-users", getUsers);
        ws.on("user-disconnected", removePeer);
        ws.on("user-started-sharing", (peerId) => setScreenSharingId(peerId));
        ws.on("user-stopped-sharing", () => setScreenSharingId(""));
        ws.on("add-message", addMessage);
        ws.on("get-messages", addHistoryMessage);

        return () => {
            ws.off("room-created");
            ws.off("get-users");
            ws.off("user-disconnected");
            ws.off("user-started-sharing");
            ws.off("user-stopped-sharing");
            ws.off("user-joined");
            ws.off("add-message");
            // ws.off("get-messages");
        }
    }, []);

    useEffect(() => {
        if (screenSharingId) {
            ws.emit("start-sharing", { peerId: screenSharingId, roomId })
        } else {
            ws.emit("stop-sharing")
        }
    }, [screenSharingId, roomId])

    useEffect(() => {
        if (!me) return;
        if (!stream) return;

        ws.on("user-joined", ({peerId}) => {
            const call = me.call(peerId, stream);
            call.on("stream", (peerStream) => {
                console.log(peerStream);
                console.log(call);
                
                dispatch(addPeerAction(peerId, peerStream))
            })

        });

        me.on("call", (call) => {
            call.answer(stream);
            call.on("stream", (peerStream) => {
                console.log(peerStream);
                console.log(call);
                
                dispatch(addPeerAction(call.peer, peerStream))
            })
        })
    }, [me, stream])

    return (
        <RoomContext.Provider
            value={{ 
                ws, 
                me, 
                stream, 
                peers, 
                chat,
                shareScreen, 
                screenSharingId, 
                setRoomId,
                sendMessage
             }}
        >
            {children}
        </RoomContext.Provider>
    );
};
