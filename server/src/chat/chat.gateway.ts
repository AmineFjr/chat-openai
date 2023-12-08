import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { OpenAI } from "openai";
import * as dotenv from 'dotenv';

interface IMessage {
    username: string;
    content: string;
    language: string;
    timeSent: string;
}

@WebSocketGateway({ cors: true })

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Socket;

    clients: { client: Socket; username?: string }[] = [];
    chatMessages: IMessage[] = [];

    openai = new OpenAI({
        apiKey: dotenv.config().parsed.OPENAI_API_KEY,
    });

    @SubscribeMessage('message')
    handleMessage(client: any, payload: any): string {
        this.server.emit('message', payload);
        return 'Hello world!';
    }

    @SubscribeMessage('chat-message')
    async handleChatMessage(client: any, payload: IMessage): Promise<void> {
        if (payload.language !== 'none') {
            let result = await this.openai.chat.completions.create({
                messages: [{role: 'user', content: `Traduit moi ce text '${payload.content}' en ${payload.language}`}],
                model: 'gpt-3.5-turbo',
            });
            payload.content = result.choices[0].message.content;
        }

        let checkMessageInformation = await this.openai.chat.completions.create({
            messages: [
                { role: 'user', content: `Est-ce que l'information suivante est correcte sans prendre en compte les fautes d'orthographe: '${payload.content}' ? repond juste par vrai ou faux` },
            ],
            model: 'gpt-3.5-turbo',
        });
        let resultCheckMessageInformation = checkMessageInformation.choices[0].message.content;
        if (!resultCheckMessageInformation.includes("Vrai" || "vrai" || "vraie" || "Vraie")) {
            payload.content += ' (information incorrecte)';
        }

        this.server.emit('chat-message', {
            ...payload,
            username: payload.username,
        });
        this.chatMessages.push({
            ...payload,
            username: payload.username,
        });
    }

    handleConnection(client: Socket) {
        console.log('client connected ', client.id);
        this.clients.push({
            client,
        });
        client.emit('messages-old', this.chatMessages);
    }

    handleDisconnect(client: any) {
        console.log('client disconnected ', client.id);
        this.clients = this.clients.filter((c) => c.client.id !== client.id);
    }
}
