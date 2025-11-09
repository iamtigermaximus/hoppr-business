"use client";

import React from "react";
import styled from "styled-components";
import BarStaffLogin from "../BarStaffLogin";

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

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const LogoImage = styled.img`
  height: 200px;
  width: 200px;
`;

const LogoText = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(-45deg, #0ea5e9, #8b5cf6, #ec4899, #0ea5e9);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: gradientShift 8s ease infinite;

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
  font-size: 1.1rem;
`;

export default function BarLoginPortal() {
  return (
    <Container>
      <LoginCard>
        <LogoContainer>
          <LogoImage
            src="/hoppr-neon-nobg.png"
            alt="Hoppr Logo"
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = "none";
            }}
          />
          <LogoText>Hoppr Business</LogoText>
        </LogoContainer>
        <Subtitle>Bar Staff Portal</Subtitle>
        <BarStaffLogin />
      </LoginCard>
    </Container>
  );
}
