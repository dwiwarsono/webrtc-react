import { useContext } from "react"
import { RoomContext } from "../context/RoomContext"

export const Join: React.FC = () => {
    const { ws } = useContext(RoomContext);
    console.log('WS from RoomContext', ws);

    const createRoom = () => {
        ws.emit("create-room");
    }
    
    return(
        <div className="bg-rose-400 p-4 rounded-lg text-xl hover:bg-rose-600 text-white"
            onClick={createRoom}
        >
            Start new meeting
        </div>
    )
}