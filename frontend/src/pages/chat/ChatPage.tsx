import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Conversation, Message } from '../../types'
import { Send, Plus, MessageCircle, Bot, User, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

function ConversationList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const { id: activeId } = useParams<{ id: string }>()

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/chat/conversations/').then((r) => Array.isArray(r.data) ? r.data : r.data.results ?? []),
  })

  const createMutation = useMutation({
    mutationFn: (lessonId?: number) =>
      api.post('/chat/conversations/', { title: 'Yangi suhbat', ...(lessonId ? { lesson: lessonId } : {}) }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/chat/${res.data.id}`)
    },
    onError: () => toast.error("Suhbat yaratib bo'lmadi"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/chat/conversations/${id}/`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      if (activeId === String(id)) navigate('/chat')
      toast.success("Suhbat o'chirildi")
    },
    onError: () => toast.error("O'chirib bo'lmadi"),
  })

  const lessonId = searchParams.get('lesson')
  useEffect(() => {
    if (lessonId) createMutation.mutate(Number(lessonId))
  }, [])

  return (
    <div className="w-64 border-r border-gray-200 flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => createMutation.mutate(undefined)}
          disabled={createMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={16} /> Yangi suhbat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations?.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center gap-2 p-3 border-b border-gray-100 transition-colors ${
              activeId === String(conv.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <Link to={`/chat/${conv.id}`} className="flex items-center gap-2 flex-1 min-w-0">
              <MessageCircle size={16} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-gray-400">{conv.message_count} xabar</p>
              </div>
            </Link>
            <button
              onClick={() => {
                if (confirm("Suhbatni o'chirishni tasdiqlaysizmi?")) {
                  deleteMutation.mutate(conv.id)
                }
              }}
              disabled={deleteMutation.isPending}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {conversations?.length === 0 && (
          <p className="text-center text-sm text-gray-400 p-4">Suhbat yo'q</p>
        )}
      </div>
    </div>
  )
}

function ChatWindow({ conversationId }: { conversationId: string }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: () => api.get(`/chat/conversations/${conversationId}/messages/`).then((r) => r.data),
    refetchInterval: false,
  })

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      api.post(`/chat/conversations/${conversationId}/send/`, { message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setInput('')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Xabar yuborib bo'lmadi"),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return
    sendMutation.mutate(input.trim())
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
        {messages?.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'
            }`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-gray-600" />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {sendMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot size={16} className="text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Savolingizni yozing..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={sendMutation.isPending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="btn-primary px-4"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Enter — yuborish. AI imtihon yechimlarini bermaydi.</p>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-4 -my-4 md:-mx-8 md:-my-6">
      <ConversationList />
      {id ? (
        <ChatWindow conversationId={id} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Bot size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Suhbat tanlang yoki yangi boshlang</p>
          </div>
        </div>
      )}
    </div>
  )
}
