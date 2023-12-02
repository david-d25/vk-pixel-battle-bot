import {Attachment, ExternalAttachment, MessageContext, VK} from "vk-io";
import DrawLogOrmService from "orm/DrawLogOrmService";
import {Context} from "../Context";
import {GroupsGroupFull, UsersUserFull} from "vk-io/lib/api/schemas/objects";

export type VkMessage = {
    conversationMessageId: number;
    peerId: number;
    fromId: number;
    timestamp: number;
    attachments: (Attachment | ExternalAttachment)[];
    text: string | null;
    forwardedMessages: VkMessage[];
}

export type VkChatMember = {
    memberId: number;
    displayName: string;
    firstName: string;
    lastName: string | null;
    isAdmin: boolean;
    type: "user" | "group";
}

export default class VkMessagesService {
    private static readonly MAX_ATTACHMENTS_PER_MESSAGE = 10;
    private vk!: VK;

    constructor (private context: Context) {
        context.onReady(this.start.bind(this));
    }

    private messagesByPeerId: Map<number, VkMessage[]> = new Map();

    private start() {
        this.vk = this.context.vk!;

        this.vk.updates.start().then(() => {
            console.log("Started VK messages long polling");
        }).catch(error => {
            console.error('Error starting Long Polling:', error);
        });

        this.vk.updates.on('message_new', async (context, next) => {
            await this.processNewMessage(context);
            await next();
        });

        this.vk.updates.on('error', error => {
            console.error('Error in updates:', error);
        });
    }

    popSinglePeerIdMessages(): VkMessage[] {
        if (this.messagesByPeerId.size == 0)
            return [];
        const key = this.messagesByPeerId.keys().next().value;
        const result = this.messagesByPeerId.get(key)!;
        this.messagesByPeerId.delete(key);
        return result;
    }

    async uploadPhotoAttachments(toId: number, images: (string | Buffer)[]): Promise<string[]> {
        const uploadServerResponse = await this.vk.api.photos.getMessagesUploadServer({});
        const uploadServerUrl = uploadServerResponse.upload_url;
        const attachments = await Promise.all(
            images.map(image => this.vk.upload.messagePhoto({
                peer_id: toId,
                source: {
                    uploadUrl: uploadServerUrl,
                    values: [{
                        value: image
                    }]
                }
            }))
        );
        return attachments.map(it => `photo${it.ownerId}_${it.id}${it.accessKey ? `_${it.accessKey}` : ''}`);
    }

    async send(
        toId: number,
        message: string,
        attachments: string[] = [],
        deleteLastDisposable: boolean = true
    ): Promise<number> {
        if (attachments.length > VkMessagesService.MAX_ATTACHMENTS_PER_MESSAGE) {
            console.warn(`[send] Too many attachments (${attachments.length}), only ${VkMessagesService.MAX_ATTACHMENTS_PER_MESSAGE} will be sent`);
            attachments = attachments.slice(0, VkMessagesService.MAX_ATTACHMENTS_PER_MESSAGE);
        }
        if (message.trim().length == 0 && attachments.length == 0)
            message = "(empty message)";
        let requestBody = {
            peer_id: toId,
            random_id: Math.floor(Math.random()*10000000),
            message,
            attachment: attachments.join(',')
        };
        const messageId = await this.vk.api.messages.send(requestBody);
        if (deleteLastDisposable) {
            await this.tryDisposeLastDisposableMessage(toId);
        }
        return messageId;
    }

    async sendDisposable(toId: number, message: string, attachments: string[] = []): Promise<void> {
        const { chatSettingsOrmService } = this.context;
        const newLastDisposableMessageId = await this.send(toId, message, attachments);
        await chatSettingsOrmService.setLastDisposableMessageId(toId, newLastDisposableMessageId);
    }

    async tryDisposeLastDisposableMessage(peerId: number): Promise<void> {
        const { chatSettingsService, chatSettingsOrmService } = this.context;
        const settings = await chatSettingsService.getSettingsOrCreateDefault(peerId);
        if (settings.lastDisposableMessageId != null) {
            try {
                await this.vk.api.messages.delete({
                    delete_for_all: 1,
                    peer_id: settings.peerId,
                    message_ids: [settings.lastDisposableMessageId]
                });
            } catch (e) {
                console.error(`[tryDisposeLastDisposableMessage] Failed to delete message ${settings.lastDisposableMessageId} for chat ${peerId}`);
            }
            await chatSettingsOrmService.setLastDisposableMessageId(peerId, null);
        }
    }

    async getChatMembers(peerId: number): Promise<VkChatMember[]> {
        const members = await this.context.vk.api.messages.getConversationMembers({
            peer_id: peerId
        });
        const userById = new Map<number, UsersUserFull>();
        const groupById = new Map<number, GroupsGroupFull>();
        members.profiles?.forEach(it => userById.set(it.id, it));
        members.groups?.forEach(it => groupById.set(it.id!, it));
        const result = members.items?.map(it => {
            const type: "group" | "user" = it.member_id! < 0 ? "group" : "user";
            const user = userById.get(it.member_id!);
            const group = groupById.get(-it.member_id!);
            const groupName = group?.name || "Unknown group";
            return {
                memberId: it.member_id!,
                displayName: type == "user" ? `${user.first_name} ${user.last_name}` : groupName,
                firstName: type == "user" ? user.first_name : groupName,
                lastName: type == "user" ? user.last_name : null,
                isAdmin: it.is_admin == true,
                type
            }
        });
        return result ? result : [];
    }

    private async processNewMessage(context: MessageContext) {
        const { peerId } = context;
        if (!this.messagesByPeerId.has(peerId)) {
            this.messagesByPeerId.set(peerId, []);
        }
        const message = this.vkMessageDtoToModel(context);
        this.messagesByPeerId.get(peerId)!.push(message);
    }

    private vkMessageDtoToModel(context: MessageContext): VkMessage {
        const result: VkMessage = {
            conversationMessageId: context.conversationMessageId!,
            peerId: context.peerId,
            fromId: context.senderId,
            timestamp: context.createdAt,
            attachments: context.attachments,
            text: typeof context.text == 'undefined' ? null : context.text,
            forwardedMessages: []
        }

        if (context.hasForwards) {
            for (const forward of context.forwards) {
                result.forwardedMessages.push(this.vkMessageDtoToModel(forward));
            }
        } else if (context.hasReplyMessage) {
            result.forwardedMessages.push(this.vkMessageDtoToModel(context.replyMessage!));
        }

        return result;
    }
}