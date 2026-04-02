import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conv_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conv_id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        user = self.scope['user']
        msg = await self.save_message(user, data['content'])
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'chat_message',
            'message_id': msg.id,
            'content': data['content'],
            'sender_id': user.id,
            'sender_name': user.full_name,
        })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, sender, content):
        conv = Conversation.objects.get(pk=self.conv_id)
        recipient = conv.participants.exclude(pk=sender.pk).first()
        msg = Message.objects.create(
            conversation=conv,
            sender=sender,
            recipient=recipient,
            content=content,
        )
        conv.save()
        return msg
