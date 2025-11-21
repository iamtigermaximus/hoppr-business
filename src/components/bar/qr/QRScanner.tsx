// src/components/bar/qr/QRScanner.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Html5QrcodeScanner } from "html5-qrcode";

const ScannerContainer = styled.div`
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ScannerTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1f2937;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ScannerSubtitle = styled.p`
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;
`;

const ScannerWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const ScannerControls = styled.div`
  text-align: center;
  margin: 1rem 0;
`;

const ResultContainer = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const ResultTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
`;

const ResultData = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  font-size: 0.875rem;
`;

const StatusMessage = styled.div<{ $success: boolean }>`
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  background: ${(props) => (props.$success ? "#dcfce7" : "#fef2f2")};
  color: ${(props) => (props.$success ? "#166534" : "#dc2626")};
  border: 1px solid ${(props) => (props.$success ? "#bbf7d0" : "#fecaca")};
`;

const ActionButtons = styled.div`
  margin-top: 1rem;
`;

const Button = styled.button<{ $variant: "primary" | "secondary" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  `
      : `
    background: #6b7280;
    color: white;
    
    &:hover {
      background: #4b5563;
    }
  `}
`;

interface QRScannerProps {
  barId: string;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  vipStatus: boolean;
  promotionsUsed: string[];
}

interface PromotionData {
  id: string;
  title: string;
  type: string;
  validUntil: string;
  usageCount: number;
}

interface ScanPayload {
  customer: CustomerData;
  promotion?: PromotionData;
  timestamp: string;
  signature: string;
}

interface ScanResultData {
  customer: CustomerData;
  promotion?: PromotionData;
  isValid: boolean;
  message: string;
  remainingUses?: number;
}

interface ScanResult {
  success: boolean;
  data?: ScanResultData;
  error?: string;
}

const QRScanner = ({ barId }: QRScannerProps) => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isScanning]);

  const startScanner = () => {
    setIsScanning(true);
    setScanResult(null);

    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
        supportedScanTypes: [],
      },
      false
    );

    scannerRef.current.render(
      async (decodedText: string) => {
        try {
          const result = await processQRCode(decodedText);
          setScanResult(result);

          if (scannerRef.current) {
            scannerRef.current.clear();
            setIsScanning(false);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to process QR code";
          setScanResult({
            success: false,
            error: errorMessage,
          });
        }
      },
      (error: string) => {
        console.warn(`QR Code scan error: ${error}`);
      }
    );
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      setIsScanning(false);
    }
  };

  const processQRCode = async (qrData: string): Promise<ScanResult> => {
    try {
      const token = localStorage.getItem("hoppr_token");

      const qrPayload: ScanPayload = JSON.parse(qrData);

      if (
        !qrPayload.customer ||
        !qrPayload.customer.id ||
        !qrPayload.timestamp
      ) {
        throw new Error("Invalid QR code format");
      }

      const response = await fetch(`/api/bar/${barId}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qrData: qrPayload,
          scannedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process scan");
      }

      const result: ScanResultData = await response.json();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    if (!isScanning) {
      startScanner();
    }
  };

  return (
    <ScannerContainer>
      <ScannerTitle>QR Code Scanner</ScannerTitle>
      <ScannerSubtitle>
        Scan customer QR codes to validate promotions and VIP passes
      </ScannerSubtitle>

      {!isScanning && !scanResult && (
        <ScannerControls>
          <Button $variant="primary" onClick={startScanner}>
            Start Scanner
          </Button>
        </ScannerControls>
      )}

      {isScanning && (
        <>
          <ScannerWrapper>
            <div id="qr-reader" style={{ width: "100%" }}></div>
          </ScannerWrapper>
          <ScannerControls>
            <Button $variant="secondary" onClick={stopScanner}>
              Stop Scanner
            </Button>
          </ScannerControls>
        </>
      )}

      {scanResult && (
        <ResultContainer>
          <StatusMessage $success={scanResult.success}>
            {scanResult.success
              ? "✅ Scan successful!"
              : `❌ Scan failed: ${scanResult.error}`}
          </StatusMessage>

          {scanResult.data && (
            <>
              <ResultTitle>Scan Result:</ResultTitle>
              <ResultData>
                <div>
                  <strong>Customer:</strong> {scanResult.data.customer.name}
                </div>
                <div>
                  <strong>Email:</strong> {scanResult.data.customer.email}
                </div>
                <div>
                  <strong>VIP Status:</strong>{" "}
                  {scanResult.data.customer.vipStatus ? "Yes" : "No"}
                </div>
                {scanResult.data.promotion && (
                  <>
                    <div>
                      <strong>Promotion:</strong>{" "}
                      {scanResult.data.promotion.title}
                    </div>
                    <div>
                      <strong>Type:</strong> {scanResult.data.promotion.type}
                    </div>
                    {scanResult.data.remainingUses !== undefined && (
                      <div>
                        <strong>Remaining Uses:</strong>{" "}
                        {scanResult.data.remainingUses}
                      </div>
                    )}
                  </>
                )}
                <div>
                  <strong>Message:</strong> {scanResult.data.message}
                </div>
              </ResultData>
            </>
          )}

          <ActionButtons>
            <Button $variant="primary" onClick={resetScanner}>
              Scan Another Code
            </Button>
          </ActionButtons>
        </ResultContainer>
      )}
    </ScannerContainer>
  );
};

export default QRScanner;
