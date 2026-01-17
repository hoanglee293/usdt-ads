'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './useAuth'

// Types
export interface Message {
  _id: string
  conversation_id: string
  sender_type: 'user' | 'admin'
  sender_id: number
  sender_info: {
    name: string
    avatar?: string | null
  }
  content: string
  is_read: boolean
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  _id: string
  user_id: number
  unread_count: number // Số tin nhắn của user mà admin chưa đọc
  user_unread_count?: number // Số tin nhắn của admin mà user chưa đọc (cho user frontend)
  last_message?: Message | null
  createdAt: string
  updatedAt: string
}

interface UseChatReturn {
  // Connection
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  
  // Conversations
  conversations: Conversation[]
  currentConversation: Conversation | null
  conversationsLoading: boolean
  
  // Messages
  messages: Message[]
  messagesLoading: boolean
  
  // Methods
  connect: () => void
  disconnect: () => void
  createConversation: (initialMessage?: string) => Promise<Conversation | null>
  getConversations: (page?: number, limit?: number) => Promise<void>
  joinConversation: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string) => Promise<void>
  getMessages: (conversationId: string, page?: number, limit?: number) => Promise<void>
  markAsRead: (conversationId: string, messageId?: string, markAll?: boolean) => Promise<void>
  
  // Events
  onNewMessage: (callback: (message: Message) => void) => void
  offNewMessage: () => void
  
  // Chat state
  setIsChatOpen: (isOpen: boolean) => void
}

export const useChat = (): UseChatReturn => {
  const { isAuth } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const currentConversationIdRef = useRef<string | null>(null) // Track current conversation ID
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [conversationsLoading, setConversationsLoading] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  
  const newMessageCallbackRef = useRef<((message: Message) => void) | null>(null)
  const isChatOpenRef = useRef<boolean>(false) // Track if chat is open
  const getConversationsRef = useRef<((page?: number, limit?: number) => Promise<void>) | null>(null) // Ref for getConversations
  const processedMessagesRef = useRef<Set<string>>(new Set()) // Track processed message IDs to avoid duplicates
  
  // Update ref when currentConversation changes
  useEffect(() => {
    currentConversationIdRef.current = currentConversation?._id || null
  }, [currentConversation])
  
  // Expose setIsChatOpen for ChatWidget to update
  const setIsChatOpen = useCallback((isOpen: boolean) => {
    isChatOpenRef.current = isOpen
    // Clear current conversation when chat is closed to ensure unread count works correctly
    // This ensures that when chat is closed, new messages will increase unread count
    if (!isOpen) {
      setCurrentConversation(null)
      setMessages([])
    }
  }, [])

  // Get API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!isAuth) {
      setError('User not authenticated')
      return
    }

    // Nếu đã có socket và đang connected hoặc đang connecting thì không tạo mới
    if (socketRef.current) {
      if (socketRef.current.connected) {
        console.log('Socket already connected, skipping')
        return
      }
      // Nếu socket tồn tại nhưng chưa connected, disconnect trước
      console.log('Disconnecting existing socket before creating new one')
      socketRef.current.disconnect()
      socketRef.current.removeAllListeners()
      socketRef.current = null
    }

    setIsConnecting(true)
    setError(null)

    // Create socket connection
    // Socket.io will automatically send HTTP-only cookies with the connection
    // Backend will read token from cookies in handshake.headers.cookie
    const socket = io(`${apiUrl}/chat`, {
      withCredentials: true, // Important: Send cookies with WebSocket connection
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('Chat connected')
      setIsConnected(true)
      setIsConnecting(false)
      setError(null)
      
      // Auto-join user to their personal room and conversation room for realtime updates
      socket.emit('user:auto:join')
    })

    socket.on('disconnect', () => {
      console.log('Chat disconnected')
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('Chat connection error:', err)
      setError(err.message || 'Failed to connect to chat')
      setIsConnecting(false)
    })

    socket.on('error', (data: { message: string }) => {
      console.error('Chat error:', data)
      setError(data.message)
    })

    // Listen for new messages
    socket.on('message:new', (data: { conversation_id: string; message: Message }) => {
      // Tránh xử lý duplicate message (có thể nhận từ cả conversation room và user room)
      if (processedMessagesRef.current.has(data.message._id)) {
        console.log('Message already processed, skipping:', data.message._id)
        return
      }
      
      // Đánh dấu message đã được xử lý
      processedMessagesRef.current.add(data.message._id)
      
      // Cleanup old message IDs after 1 minute to prevent memory leak
      setTimeout(() => {
        processedMessagesRef.current.delete(data.message._id)
      }, 60000)
      
      // Use ref to get current conversation ID (always up-to-date)
      const isCurrentConversation = data.conversation_id === currentConversationIdRef.current
      const isFromAdmin = data.message.sender_type === 'admin'
      const isChatOpen = isChatOpenRef.current
      
      // Nếu user đang ở trong chat và nhận tin nhắn mới từ admin trong conversation hiện tại
      // Tự động mark as read ngay lập tức
      if (isChatOpen && isCurrentConversation && isFromAdmin && !data.message.is_read) {
        // Tự động mark as read tin nhắn này
        socket.emit('user:mark:read', {
          conversation_id: data.conversation_id,
          message_id: data.message._id,
          mark_all: false,
        })
      }
      
      if (isCurrentConversation) {
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some((m) => m._id === data.message._id)
          if (exists) return prev
          return [...prev, data.message]
        })
      }
      
      // Update conversations unread count
      // user_unread_count đại diện cho số tin nhắn chưa đọc của USER (tin nhắn của admin mà user chưa đọc)
      // Chỉ tăng user_unread_count khi admin gửi tin nhắn và user chưa đọc
      // Nếu user đang ở trong chat và đang xem conversation này, không tăng vì sẽ tự động mark as read
      setConversations((prev) => {
        const existingConv = prev.find((conv) => conv._id === data.conversation_id)
        
        // Nếu conversation chưa có trong list, refresh conversations để lấy đầy đủ thông tin
        if (!existingConv) {
          // Refresh conversations để lấy conversation mới với user_unread_count chính xác
          setTimeout(() => {
            if (getConversationsRef.current) {
              getConversationsRef.current()
            }
          }, 100)
          return prev
        }
        
        // Cập nhật conversation đã có
        return prev.map((conv) => {
          if (conv._id === data.conversation_id) {
            // Chỉ tăng user_unread_count nếu:
            // 1. Tin nhắn là từ admin
            // 2. User KHÔNG đang mở chat HOẶC không đang xem conversation này
            //    (Nếu user đang mở chat VÀ đang xem conversation này, thì sẽ tự động mark as read, không tăng unread)
            //    (Nếu user đóng chat, dù có phải current conversation hay không, vẫn tăng unread vì user không thấy)
            const shouldIncreaseUnread = isFromAdmin && (!isChatOpen || !isCurrentConversation)
            const newUnreadCount = shouldIncreaseUnread 
              ? (conv.user_unread_count || 0) + 1 
              : (conv.user_unread_count || 0)
            
            console.log('Updating conversation unread count:', {
              conversation_id: data.conversation_id,
              message_id: data.message._id,
              isFromAdmin,
              isCurrentConversation,
              isChatOpen,
              shouldIncreaseUnread,
              oldUnreadCount: conv.user_unread_count || 0,
              newUnreadCount,
            })
            
            return {
              ...conv,
              user_unread_count: newUnreadCount,
              last_message: data.message,
            }
          }
          return conv
        })
      })

      // Call callback if set
      if (newMessageCallbackRef.current) {
        newMessageCallbackRef.current(data.message)
      }
    })

    socket.on('message:sent', (data: { conversation_id: string; message: Message }) => {
      // Message sent successfully, add to messages if in current conversation
      // Use ref to get current conversation ID (always up-to-date)
      console.log('Received message:sent event', {
        conversation_id: data.conversation_id,
        currentConversationId: currentConversationIdRef.current,
        message: data.message,
      })
      
      if (data.conversation_id === currentConversationIdRef.current) {
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some((m) => m._id === data.message._id)
          if (exists) {
            console.log('Message already exists, skipping')
            return prev
          }
          console.log('Adding message to state', data.message)
          return [...prev, data.message]
        })
      } else {
        console.log('Message not for current conversation, skipping')
      }
    })

    socket.on('conversation:created', (data: { conversation_id: string; user_id: number; unread_count: number }) => {
      // Refresh conversations list
      getConversations()
    })

    socket.on('message:marked:read', () => {
      // Refresh messages to update read status
      if (currentConversation) {
        getMessages(currentConversation._id)
      }
    })

    socket.on('messages:marked:read', (data: { conversation_id: string; marked_count: number; unread_count: number; user_unread_count?: number }) => {
      // Update conversation unread count
      // Sử dụng user_unread_count từ backend nếu có, nếu không thì set về 0
      const newUserUnreadCount = data.user_unread_count !== undefined ? data.user_unread_count : 0
      
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === data.conversation_id
            ? { ...conv, user_unread_count: newUserUnreadCount }
            : conv
        )
      )
      
      if (currentConversation?._id === data.conversation_id) {
        setCurrentConversation((prev) => prev ? { ...prev, user_unread_count: newUserUnreadCount } : null)
        getMessages(data.conversation_id)
      }
    })

    socketRef.current = socket
  }, [isAuth, apiUrl, currentConversation])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting socket')
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  // Create conversation
  const createConversation = useCallback(async (initialMessage?: string): Promise<Conversation | null> => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat')
      return null
    }

    return new Promise((resolve, reject) => {
      socketRef.current?.emit('user:create:conversation', { content: initialMessage }, (response: any) => {
        if (response?.error) {
          setError(response.error)
          reject(new Error(response.error))
          return
        }
      })

      socketRef.current?.once('conversation:created', (data: { conversation_id: string; user_id: number; unread_count: number }) => {
        const newConversation: Conversation = {
          _id: data.conversation_id,
          user_id: data.user_id,
          unread_count: data.unread_count,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setConversations((prev) => [newConversation, ...prev])
        resolve(newConversation)
      })

      socketRef.current?.once('error', (data: { message: string }) => {
        setError(data.message)
        reject(new Error(data.message))
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Timeout creating conversation'))
      }, 10000)
    })
  }, [])

  // Get conversations
  const getConversations = useCallback(async (page: number = 1, limit: number = 20) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat')
      return
    }

    setConversationsLoading(true)
    
    socketRef.current.emit('user:get:conversations', { page, limit })

    socketRef.current.once('user:conversations', (data: { conversations: Conversation[]; meta: any }) => {
      setConversations(data.conversations)
      setConversationsLoading(false)
    })

    socketRef.current.once('error', (data: { message: string }) => {
      setError(data.message)
      setConversationsLoading(false)
    })
  }, [])
  
  // Update ref when getConversations changes
  useEffect(() => {
    getConversationsRef.current = getConversations
  }, [getConversations])

  // Join conversation
  const joinConversation = useCallback(async (conversationId: string) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat')
      return
    }

    setMessagesLoading(true)
    setMessages([])

    socketRef.current.emit('user:join:conversation', { conversation_id: conversationId })

    // Set timeout to prevent stuck loading
    const timeout = setTimeout(() => {
      setMessagesLoading(false)
    }, 5000)

    socketRef.current.once('user:joined', (data: { conversation_id: string }) => {
      // Find conversation in list
      const conversation = conversations.find((c) => c._id === data.conversation_id)
      if (conversation) {
        setCurrentConversation(conversation)
      }
    })

    socketRef.current.once('user:messages', (data: { conversation_id: string; messages: Message[] }) => {
      clearTimeout(timeout)
      setMessages(data.messages)
      setMessagesLoading(false)
    })

    socketRef.current.once('error', (data: { message: string }) => {
      clearTimeout(timeout)
      setError(data.message)
      setMessagesLoading(false)
    })
  }, [conversations])

  // Send message
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat')
      return
    }

    if (!content.trim()) {
      setError('Message cannot be empty')
      return
    }

    socketRef.current.emit('user:send:message', {
      conversation_id: conversationId,
      content: content.trim(),
    })

    socketRef.current.once('error', (data: { message: string }) => {
      setError(data.message)
    })
  }, [])

  // Get messages
  const getMessages = useCallback(async (conversationId: string, page: number = 1, limit: number = 50) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat')
      return
    }

    setMessagesLoading(true)

    socketRef.current.emit('user:get:messages', { conversation_id: conversationId, page, limit })

    // Set timeout to prevent stuck loading
    const timeout = setTimeout(() => {
      setMessagesLoading(false)
    }, 5000)

    socketRef.current.once('user:messages', (data: { conversation_id: string; messages: Message[]; meta: any }) => {
      clearTimeout(timeout)
      setMessages(data.messages)
      setMessagesLoading(false)
    })

    socketRef.current.once('error', (data: { message: string }) => {
      clearTimeout(timeout)
      setError(data.message)
      setMessagesLoading(false)
    })
  }, [])

  // Mark as read
  const markAsRead = useCallback(async (conversationId: string, messageId?: string, markAll: boolean = false) => {
    if (!socketRef.current?.connected) {
      setError('Not connected to chat')
      return
    }

    socketRef.current.emit('user:mark:read', {
      conversation_id: conversationId,
      message_id: messageId,
      mark_all: markAll,
    })

    socketRef.current.once('error', (data: { message: string }) => {
      setError(data.message)
    })
  }, [])

  // Event listeners
  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    newMessageCallbackRef.current = callback
  }, [])

  const offNewMessage = useCallback(() => {
    newMessageCallbackRef.current = null
  }, [])

  // Auto connect/disconnect based on auth
  useEffect(() => {
    if (isAuth) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      // Cleanup khi component unmount hoặc isAuth thay đổi
      disconnect()
    }
    // Chỉ depend vào isAuth, không depend vào connect/disconnect để tránh re-run không cần thiết
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth])

  return {
    // Connection
    isConnected,
    isConnecting,
    error,
    
    // Conversations
    conversations,
    currentConversation,
    conversationsLoading,
    
    // Messages
    messages,
    messagesLoading,
    
    // Methods
    connect,
    disconnect,
    createConversation,
    getConversations,
    joinConversation,
    sendMessage,
    getMessages,
    markAsRead,
    
    // Events
    onNewMessage,
    offNewMessage,
    
    // Chat state
    setIsChatOpen,
  }
}
