"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";

interface Message {
  id: string;
  senderType: "ASSISTANT" | "USER";
  content: string;
  createdAt: string;
}

interface Props {
  barId: string;
  isOpen: boolean;
  onClose: () => void;
}

const Panel = styled.div<{ $open: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${(p) => (p.$open ? "60vh" : "0")};
  background: #fff;
  border-top: 1px solid #e5e7eb;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
  transition: height 0.3s ease;
  overflow: hidden;
  z-index: 100;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const HeaderTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;

  &:hover {
    color: #6b7280;
  }
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Bubble = styled.div<{ $isUser: boolean }>`
  max-width: 85%;
  padding: 10px 14px;
  border-radius: ${(p) =>
    p.$isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px"};
  background: ${(p) => (p.$isUser ? "#7c3aed" : "#f3f4f6")};
  color: ${(p) => (p.$isUser ? "#fff" : "#1f2937")};
  align-self: ${(p) => (p.$isUser ? "flex-end" : "flex-start")};
  font-size: 13px;
  line-height: 1.45;
`;

const InputBar = styled.form`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const TextInput = styled.input`
  flex: 1;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  color: #1f2937;
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SendButton = styled.button`
  padding: 10px 16px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:not(:disabled):hover {
    background: #6d28d9;
  }
`;

const LoadingDots = styled.span`
  &::after {
    content: "...";
    animation: dots 1.5s steps(4, end) infinite;
  }

  @keyframes dots {
    0%,
    20% {
      content: ".";
    }
    40% {
      content: "..";
    }
    60%,
    100% {
      content: "...";
    }
  }
`;

export function ChatPanel({ barId, isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("hoppr_token");
      fetch(`/api/auth/bar/${barId}/insights/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setMessages(d.messages || []))
        .catch(() => {});
    }
  }, [isOpen, barId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    setLoading(true);

    // Optimistic user message
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        senderType: "USER",
        content,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const token = localStorage.getItem("hoppr_token");
      const res = await fetch(
        `/api/auth/bar/${barId}/insights/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          senderType: "ASSISTANT",
          content:
            "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel $open={isOpen}>
      <Header>
        <HeaderTitle>Hoppr Assistant</HeaderTitle>
        <CloseButton onClick={onClose} aria-label="Close chat">
          ×
        </CloseButton>
      </Header>
      <Messages>
        {messages.length === 0 && (
          <Bubble $isUser={false}>
            Hey! I'm your Hoppr assistant. Ask me about your bar's performance,
            what to post next, or how to get more people in.
          </Bubble>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} $isUser={m.senderType === "USER"}>
            {m.content}
          </Bubble>
        ))}
        {loading && (
          <Bubble $isUser={false}>
            <LoadingDots />
          </Bubble>
        )}
        <div ref={bottomRef} />
      </Messages>
      <InputBar
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your bar's performance..."
          disabled={loading}
        />
        <SendButton type="submit" disabled={!input.trim() || loading}>
          Send
        </SendButton>
      </InputBar>
    </Panel>
  );
}
