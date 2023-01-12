import { useContext } from "react"
import { RoomContext } from "../../context/RoomContext"
import { IMessage } from "../../types/chat"
import classNames from 'classnames'

export const ChatBubble: React.FC<{message: IMessage}> = ({message}) => {
    const { me } = useContext(RoomContext);
    const itSelf = message.author === me?.id;

    return (
        <div className={classNames("m-2 flex", {
            "pl-10 justify-end": itSelf,
            "pr-10 justify-start": !itSelf,
        })}>
            <div className={classNames("inline-block py-2 px-4 rounded text-white", {
                "bg-red-200": itSelf,
                "bg-red-300": !itSelf,
            })}>{message?.content}</div>
        </div>
    )
}