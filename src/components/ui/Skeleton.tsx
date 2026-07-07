"use client";

import styled, { keyframes, css } from "styled-components";

// ---- Animation ----

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
`;

const skeletonBase = css`
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 0.25rem;
`;

// ---- Base shapes ----

export const SkeletonBox = styled.div<{
  $width?: string;
  $height?: string;
  $radius?: string;
}>`
  ${skeletonBase}
  width: ${({ $width }) => $width || "100%"};
  height: ${({ $height }) => $height || "1rem"};
  border-radius: ${({ $radius }) => $radius || "0.25rem"};
`;

export const SkeletonCircle = styled.div<{ $size?: string }>`
  ${skeletonBase}
  width: ${({ $size }) => $size || "2rem"};
  height: ${({ $size }) => $size || "2rem"};
  border-radius: 50%;
`;

export const SkeletonText = styled.div<{ $lines?: number; $lastShort?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  ${({ $lines = 3, $lastShort }) =>
    Array.from({ length: $lines }).map((_, i) => {
      const isLast = i === $lines - 1;
      return `
        &:nth-child(${i + 1}) {
          ${skeletonBase}
          height: 0.75rem;
          width: ${isLast && $lastShort ? "60%" : "100%"};
          border-radius: 0.25rem;
        }
      `;
    }).join("")}
`;

// ---- Composed patterns ----

export const SkeletonCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SkeletonTable = styled.div`
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

export const SkeletonTableHeader = styled.div`
  ${skeletonBase}
  height: 2.5rem;
  border-radius: 0;
  margin-bottom: 0;
`;

export const SkeletonTableRow = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
`;

export const SkeletonTableCell = styled.div<{ $width?: string }>`
  ${skeletonBase}
  height: 0.875rem;
  width: ${({ $width }) => $width || "100%"};
  border-radius: 0.25rem;
`;

// ---- Page layout patterns ----

export const SkeletonPageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

export const SkeletonFilterBar = styled.div`
  display: flex;
  gap: 0.625rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

export const SkeletonContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
  }
`;

export const SkeletonSidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
