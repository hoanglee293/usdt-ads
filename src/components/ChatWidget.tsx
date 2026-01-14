'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2, AlertCircle } from 'lucide-react'
import { useChat, Message, Conversation } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/lang/useLang'
import { format } from 'date-fns'

export default function ChatWidget() {
  const { isAuth } = useAuth()
  const { t } = useLang()
  const [isOpen, setIsOpen] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    isConnected,
    isConnecting,
    error,
    conversations,
    currentConversation,
    messages,
    messagesLoading,
    createConversation,
    getConversations,
    joinConversation,
    sendMessage,
    markAsRead,
    setIsChatOpen,
  } = useChat()

  // Load conversations when connected
  useEffect(() => {
    if (isConnected && isAuth) {
      getConversations()
    }
  }, [isConnected, isAuth])

  // Auto join conversation if exists (only when chat is opened)
  useEffect(() => {
    if (isOpen && isConnected && conversations.length > 0 && !currentConversation) {
      const firstConversation = conversations[0]
      joinConversation(firstConversation._id)
    }
  }, [isOpen, isConnected, conversations, currentConversation])

  // Auto scroll to bottom when new message
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Update chat open state in hook
  useEffect(() => {
    setIsChatOpen(isOpen)
  }, [isOpen, setIsChatOpen])

  // Mark as read when conversation is opened
  useEffect(() => {
    if (isOpen && currentConversation && (currentConversation.user_unread_count || 0) > 0) {
      markAsRead(currentConversation._id, undefined, true)
    }
  }, [isOpen, currentConversation, markAsRead])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    const content = messageInput.trim()
    setMessageInput('')

    try {
      // If no conversation exists, create one with the first message
      if (!currentConversation && conversations.length === 0) {
        const newConv = await createConversation(content)
        if (newConv) {
          await joinConversation(newConv._id)
        }
      } else if (currentConversation) {
        // Send message to existing conversation
        await sendMessage(currentConversation._id, content)
      } else {
        // If conversation exists but not joined, join it first
        const firstConv = conversations[0]
        if (firstConv) {
          await joinConversation(firstConv._id)
          await sendMessage(firstConv._id, content)
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setMessageInput(content) // Restore message on error
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleOpenChat = async () => {
    setIsOpen(true)
    
    // If no conversation exists, just load conversations
    // Don't create conversation until user sends first message
    if (conversations.length === 0 && isConnected) {
      getConversations()
    }
  }

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 24) {
        return format(date, 'HH:mm')
      } else if (diffInHours < 48) {
        return t('chat.yesterday') || 'Yesterday'
      } else {
        return format(date, 'dd/MM/yyyy HH:mm')
      }
    } catch {
      return ''
    }
  }

  // Don't show if not authenticated
  if (!isAuth) {
    return null
  }

  // Hiển thị số lượng tin nhắn chưa đọc (user_unread_count)
  // user_unread_count đại diện cho số tin nhắn của admin mà user chưa đọc
  const unreadCount = conversations.reduce((sum, conv) => sum + (conv.user_unread_count || 0), 0)

  return (
    <>
      {/* Chat Button - Fixed bottom right */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-none outline-none cursor-pointer"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 sm:w-9 sm:h-9 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[80vw] sm:w-96 h-[60vh] sm:h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden font-inter">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-xs sm:text-base font-inter">
                  {t('chat.support') || 'Support Chat'}
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-400' : isConnecting ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-white/80 text-xs">
                    {isConnected
                      ? t('chat.online') || 'Online'
                      : isConnecting
                      ? t('chat.connecting') || 'Connecting...'
                      : t('chat.offline') || 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 bg-transparent flex items-center justify-center transition-colors border-none outline-none cursor-pointer"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messagesLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('chat.noMessages') || 'No messages yet. Start the conversation!'}
                </p>
              </div>
            ) : (
              messages.map((message: Message) => {
                const isUser = message.sender_type === 'user'
                return (
                  <div
                    key={message._id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[75%] flex flex-col ${
                        isUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Sender Info (only for admin messages) */}
                      {!isUser && (
                        <div className="flex items-center gap-2 mb-1">
                          {message.sender_info.avatar ? (
                            <img
                              src={message.sender_info.avatar}
                              alt={message.sender_info.name}
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-white text-xs">
                                {message.sender_info.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {message.sender_info.name}
                          </span>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isUser
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !isConnected
                    ? isConnecting
                      ? t('chat.connecting') || 'Connecting...'
                      : t('chat.waiting') || 'Waiting to connect...'
                    : t('chat.typeMessage') || 'Type a message...'
                }
                className="flex-1 rounded-xl border-none outline-none px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isConnected || messagesLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || !isConnected || messagesLoading}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all border-none outline-none cursor-pointer"
                aria-label="Send message"
              >
                {messagesLoading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
