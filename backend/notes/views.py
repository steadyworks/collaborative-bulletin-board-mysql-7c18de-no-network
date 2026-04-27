import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Note


def broadcast(data):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)('board', {
        'type': 'board_message',
        'data': data,
    })


def note_to_dict(note):
    return {
        'id': note.id,
        'text': note.text,
        'x': note.x,
        'y': note.y,
    }


@csrf_exempt
def notes_list(request):
    if request.method == 'GET':
        notes = Note.objects.all()
        return JsonResponse([note_to_dict(n) for n in notes], safe=False)

    elif request.method == 'POST':
        data = json.loads(request.body)
        note = Note.objects.create(
            text=data.get('text', ''),
            x=data['x'],
            y=data['y'],
        )
        note_data = note_to_dict(note)
        broadcast({'type': 'note_created', 'note': note_data})
        return JsonResponse(note_data, status=201)

    elif request.method == 'DELETE':
        Note.objects.all().delete()
        broadcast({'type': 'notes_cleared'})
        return JsonResponse({'status': 'ok'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def note_detail(request, note_id):
    try:
        note = Note.objects.get(id=note_id)
    except Note.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

    if request.method == 'PATCH':
        data = json.loads(request.body)
        note.text = data.get('text', note.text)
        note.save()
        note_data = note_to_dict(note)
        broadcast({'type': 'note_updated', 'note': note_data})
        return JsonResponse(note_data)

    elif request.method == 'DELETE':
        note.delete()
        broadcast({'type': 'note_deleted', 'id': note_id})
        return JsonResponse({'status': 'ok'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)
