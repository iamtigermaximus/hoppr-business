// src/components/auth/AdminLogin.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 480px) {
    gap: 16px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  text-align: left;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (max-width: 480px) {
    padding: 10px 14px;
    font-size: 16px; /* Prevent zoom on iOS */
    border-radius: 6px;
  }
`;

const Button = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 8px;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 12px 16px;
    font-size: 16px;
    border-radius: 6px;
    margin-top: 4px;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;

  @media (max-width: 480px) {
    padding: 10px 14px;
    font-size: 13px;
    border-radius: 6px;
  }
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;

  @media (max-width: 480px) {
    padding: 10px 14px;
    font-size: 13px;
    border-radius: 6px;
  }
`;

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token in cookies AND localStorage
      const token = data.token;
      const userData = JSON.stringify(data.user);

      // Store in cookies (for server-side access)
      document.cookie = `hoppr_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `hoppr_user=${encodeURIComponent(
        userData
      )}; path=/; max-age=86400; SameSite=Lax`;

      // Also store in localStorage (for client-side access)
      localStorage.setItem("hoppr_token", token);
      localStorage.setItem("hoppr_user", userData);

      setSuccess("Login successful! Redirecting...");

      // Redirect to admin dashboard
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <InputGroup>
        <Label htmlFor="admin-email">Admin Email</Label>
        <Input
          id="admin-email"
          type="email"
          placeholder="Enter your admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
        />
      </InputGroup>

      <InputGroup>
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
        />
      </InputGroup>

      <Button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </Form>
  );
};
export default AdminLogin;
