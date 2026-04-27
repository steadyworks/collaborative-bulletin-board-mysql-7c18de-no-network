import json
from channels.generic.websocket import AsyncWebsocketConsumer

# Track connected channel names for user count
connected_channels = set()


class BoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        connected_channels.add(self.channel_name)
        await self.channel_layer.group_add('board', self.channel_name)
        await self.accept()
        # Broadcast updated user count to all connected clients
        await self.channel_layer.group_send('board', {
            'type': 'board_message',
            'data': {'type': 'user_count', 'count': len(connected_channels)},
        })

    async def disconnect(self, close_code):
        connected_channels.discard(self.channel_name)
        await self.channel_layer.group_discard('board', self.channel_name)
        # Broadcast updated user count to remaining clients
        await self.channel_layer.group_send('board', {
            'type': 'board_message',
            'data': {'type': 'user_count', 'count': len(connected_channels)},
        })

    async def board_message(self, event):
        await self.send(text_data=json.dumps(event['data']))
