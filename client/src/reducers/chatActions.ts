import { IMessage } from "../types/chat"

export const ADD_MESSAGE = "ADD_MESSAGE" as const
export const ADD_HISTORY_MESSAGE = "ADD_HISTORY_MESSAGE" as const

export const addMessageAction = (message: IMessage) => ({
    type: ADD_MESSAGE,
    payload: {message}
})

export const addHistoryMessageAction = (history: IMessage) => ({
    type: ADD_HISTORY_MESSAGE,
    payload: {history}
})