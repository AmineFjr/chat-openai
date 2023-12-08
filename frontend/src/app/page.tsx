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
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState<string>("");

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

        socket.on("message-suggest", (data) => {
            console.log(data)
            setSuggestions(data)
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
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = "fr-FR";
            recognition.onresult = (event)  => {
                if (event.results.length > 0) {
                    const transcript = event.results[0][0].transcript;
                    setText(transcript);
                }
            }
            recognition.start();
        } else {
            alert("Votre navigateur ne supporte pas la reconnaissance vocale");
        }
    }

    const handleSuggestions = () => {
        socket.emit("message-suggest", {
            content: text,
        })
    }

    const handleSuggestionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSuggestion(e.target.value);
        setText(e.target.value);
    }

    return (
        <div className="flex flex-col h-screen overflow-visible bg-white dark:bg-gray-800">
            <div className="flex-1 p-4 overflow-y-auto bg-gray-800 text-white">
                {messages.map((message: IMessage, index) => (
                    <div key={index} className="flex flex-col mb-4">
                        <div
                            className={`flex flex-col mb-2 ${message.username === username ? "items-end text-green-400" : "text-blue-400"}`}>
                            <span className="font-bold">{message.username} : </span>
                            <p className="mt-1 text-sm">{message.content}</p>
                            <span className="mt-1 text-xs text-gray-400">{reformatDate(message.timeSent)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center p-4 border-t border-gray-700 dark:border-gray-600">
                <select
                    onChange={handleSuggestionSelect}
                    className="px-2 py-2 mr-2 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:focus:ring-blue-600">
                    <option value="">Select a suggestion...</option>
                    {suggestions.map((suggestion, index) => (
                        <option key={index} value={suggestion}>{suggestion}</option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={handleSuggestions}
                    className="mr-2 text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 dark:bg-green-600 dark:focus:ring-green-600 rounded-lg px-4 py-2">
                    Suggest
                </button>

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
                    onChange={e => setLanguage(e.target.value)}
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