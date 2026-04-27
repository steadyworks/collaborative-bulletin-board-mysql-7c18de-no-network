import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = 'http://localhost:3001/api'

export default function Home() {
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [editedText, setEditedText] = useState({})
  const [userCount, _setUserCount] = useState(0)

  // Fetch initial notes
  useEffect(() => {
    fetch(`${API_BASE}/notes/`)
      .then((r) => r.json())
      .then((data) => setNotes(data))
      .catch(console.error)
  }, [])

  const handleBoardClick = useCallback(
    (e) => {
      // Only create a note when clicking directly on the board background
      if (e.target !== e.currentTarget) return

      // Deactivate any active note
      setActiveNote(null)

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      fetch(`${API_BASE}/notes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '', x, y }),
      }).catch(console.error)
    },
    []
  )

  const handleNoteClick = useCallback((e, noteId) => {
    e.stopPropagation()
    setActiveNote(noteId)
  }, [])

  const handleTextChange = useCallback((noteId, value) => {
    setEditedText((prev) => ({ ...prev, [noteId]: value }))
  }, [])

  const handleSave = useCallback(
    (e, noteId) => {
      e.stopPropagation()
      const text = editedText[noteId]
      if (text === undefined) return

      // Optimistically clear edited state
      setEditedText((prev) => {
        const next = { ...prev }
        delete next[noteId]
        return next
      })

      fetch(`${API_BASE}/notes/${noteId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }).catch(console.error)
    },
    [editedText]
  )

  const handleDelete = useCallback((e, noteId) => {
    e.stopPropagation()
    setActiveNote(null)
    fetch(`${API_BASE}/notes/${noteId}/`, { method: 'DELETE' }).catch(console.error)
  }, [])

  const handleDeleteAll = useCallback((e) => {
    e.stopPropagation()
    fetch(`${API_BASE}/notes/`, { method: 'DELETE' }).catch(console.error)
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Overlay UI — fixed so they don't interfere with board click coords */}
      <div
        data-testid="user-count"
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 200,
          background: 'rgba(255,255,255,0.9)',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 14,
          pointerEvents: 'none',
        }}
      >
        {userCount} user{userCount !== 1 ? 's' : ''} connected
      </div>

      <button
        data-testid="delete-all-btn"
        onClick={handleDeleteAll}
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 200,
          padding: '4px 12px',
          cursor: 'pointer',
        }}
      >
        Delete All
      </button>

      {/* Board surface */}
      <div
        data-testid="board"
        onClick={handleBoardClick}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          background: '#e8e8e8',
          cursor: 'crosshair',
        }}
      >
        {notes.map((note) => {
          const isActive = activeNote === note.id
          const isDirty = editedText[note.id] !== undefined
          const displayText = isDirty ? editedText[note.id] : note.text

          return (
            <div
              key={note.id}
              data-testid={`note-${note.id}`}
              onClick={(e) => handleNoteClick(e, note.id)}
              style={{
                position: 'absolute',
                left: note.x,
                top: note.y,
                background: '#fffde7',
                border: isActive ? '2px solid #1976d2' : '1px solid #ccc',
                borderRadius: 4,
                padding: '8px',
                minWidth: 120,
                minHeight: 80,
                cursor: 'pointer',
                boxShadow: isActive
                  ? '0 4px 12px rgba(0,0,0,0.2)'
                  : '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: isActive ? 10 : 1,
                userSelect: 'none',
              }}
            >
              <textarea
                data-testid={`note-text-${note.id}`}
                value={displayText}
                onChange={(e) => handleTextChange(note.id, e.target.value)}
                readOnly={!isActive}
                style={{
                  display: 'block',
                  width: '100%',
                  minHeight: 50,
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  outline: 'none',
                  cursor: isActive ? 'text' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                }}
              />

              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {isActive && isDirty && (
                  <button
                    data-testid={`note-save-${note.id}`}
                    onClick={(e) => handleSave(e, note.id)}
                    style={{ padding: '2px 8px', cursor: 'pointer' }}
                  >
                    Save
                  </button>
                )}
                {isActive && (
                  <button
                    data-testid={`note-delete-${note.id}`}
                    onClick={(e) => handleDelete(e, note.id)}
                    style={{ padding: '2px 8px', cursor: 'pointer', color: 'red' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
