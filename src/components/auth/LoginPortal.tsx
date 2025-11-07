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

  @media (max-width: 768px) {
    padding: 16px;
    justify-content: flex-start;
    min-height: 100vh;
  }
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 440px;
  text-align: center;

  @media (max-width: 768px) {
    padding: 24px;
    border-radius: 12px;
    margin-top: 20px;
    max-width: 100%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 480px) {
    padding: 20px 16px;
    margin-top: 10px;
  }
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 6px;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
  font-size: 1.1rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 20px;
  }
`;

const TabContainer = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;

  @media (max-width: 480px) {
    border-radius: 8px;
    margin-bottom: 20px;
  }
`;

interface TabProps {
  $active: boolean;
}

const Tab = styled.button<TabProps>`
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: ${(props) => (props.$active ? "white" : "transparent")};
  color: ${(props) => (props.$active ? "#1f2937" : "#6b7280")};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${(props) =>
    props.$active ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none"};
  font-size: 14px;
  white-space: nowrap;

  &:hover {
    color: #1f2937;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
    font-size: 13px;
    border-radius: 6px;
  }
`;

type LoginType = "admin" | "bar";

const LoginPortal = () => {
  const [loginType, setLoginType] = useState<LoginType>("admin");

  return (
    <Container>
      <LoginCard>
        <Logo>Hoppr Business</Logo>
        <Subtitle>Management Dashboard</Subtitle>

        <TabContainer>
          <Tab
            $active={loginType === "admin"}
            onClick={() => setLoginType("admin")}
          >
            Admin Login
          </Tab>
          <Tab
            $active={loginType === "bar"}
            onClick={() => setLoginType("bar")}
          >
            Bar Staff Login
          </Tab>
        </TabContainer>

        {loginType === "admin" ? <AdminLogin /> : <BarStaffLogin />}
      </LoginCard>
    </Container>
  );
};
export default LoginPortal;
