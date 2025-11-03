// src/components/auth/LoginPortal.tsx

"use client";

import React, { useState } from "react";
import styled from "styled-components";
import AdminLogin from "./AdminLogin";
import BarStaffLogin from "./BarStaffLogin";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 440px;
  text-align: center;
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
  font-size: 1.1rem;
`;

const TabContainer = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: ${(props) => (props.active ? "white" : "transparent")};
  color: ${(props) => (props.active ? "#1f2937" : "#6b7280")};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${(props) =>
    props.active ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none"};

  &:hover {
    color: #1f2937;
  }
`;

type LoginType = "admin" | "bar";

export default function LoginPortal() {
  const [loginType, setLoginType] = useState<LoginType>("admin");

  return (
    <Container>
      <LoginCard>
        <Logo>Hoppr Business</Logo>
        <Subtitle>Management Dashboard</Subtitle>

        <TabContainer>
          <Tab
            active={loginType === "admin"}
            onClick={() => setLoginType("admin")}
          >
            Admin Login
          </Tab>
          <Tab active={loginType === "bar"} onClick={() => setLoginType("bar")}>
            Bar Staff Login
          </Tab>
        </TabContainer>

        {loginType === "admin" ? <AdminLogin /> : <BarStaffLogin />}
      </LoginCard>
    </Container>
  );
}
