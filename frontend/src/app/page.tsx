"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

interface IMessage {
    username: string;
    content: string;
    language: string;
    timeSent: string;
}

const socket = io(process.env.BACKEND_URL || "http://localhost:3000")
const reformatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
};

const clientUsername = (): string => {
    const username = prompt("What is your username?");
    if (username) {
        return username;
    } else {
        alert("Please enter a username");
        return clientUsername();
    }
}

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [username, setUsername] = useState("");
    const [language, setLanguage] = useState("none");

    useEffect(() => {
        let storageUsername = localStorage.getItem("username");
        if (!storageUsername) {
            setUsername(clientUsername)
            localStorage.setItem("username", username);
        }

        socket.on("connect", () => {
            console.log("connected", socket.id);
            localStorage.getItem("username") && setUsername(localStorage.getItem("username") as string);
        });

        socket.once("messages-old", (data) => {
            setMessages(data);
        });

        socket.on("chat-message", (data) => {
            setMessages((msg) => [...msg, data] as any);
        });

    }, []);

    const handleSubmit = () => {
        if (text && username) {
            socket.emit("chat-message", {
                username: username,
                content: text,
                language: language,
                timeSent: new Date().toISOString(),
            })
            setText("");
            setLanguage("none")
        }
    };

    const handleSpeech = () => {
    }

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-gray-800">
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((message:IMessage, index) => (
                    <div key={index} className="flex flex-col mb-4">
                        <div className={`flex items-center mb-2 ${message.username === username ? "justify-end" : "justify-start"}`}>                            {message.username} {message.content}
                            <p className="ml-2 text-sm/10 text-gray-900 dark:text-gray-400">
                                {reformatDate(message.timeSent)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center p-4 border-t border-gray-700 dark:border-gray-600">
                <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 mr-2 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:focus:ring-blue-600"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    autoComplete="off"
                    autoFocus
                />

                <button
                    type="button"
                    onClick={handleSubmit}
                    className="mr-2 text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-blue-600 dark:focus:ring-blue-600 rounded-lg px-4 py-2">
                    Send
                </button>

                <select
                    onChange={ e => setLanguage(e.target.value) }
                    className="px-2 py-2 mr-2 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:focus:ring-blue-600">
                    <option value="none">choose</option>
                    <option value="anglais">English</option>
                    <option value="français">French</option>
                    <option value="espagnol">Spanish</option>
                </select>

                <button
                    type="button"
                    onClick={handleSpeech}>
                    <svg
                       xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       viewBox="0 0 24 24"
                       strokeWidth={1.5}
                       stroke="currentColor"
                       className="w-6 h-6"
                    >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                        />
                    </svg>
                </button>
            </div>
        </div>
    )
}