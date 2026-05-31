"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Html5QrcodeScanner } from "html5-qrcode";

// ---- Styled Components ----

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
  margin-bottom: 0.5rem;
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

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
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
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const StatusBanner = styled.div<{ $success: boolean }>`
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${({ $success }) => ($success ? "#dcfce7" : "#fef2f2")};
  color: ${({ $success }) => ($success ? "#166534" : "#dc2626")};
  border: 1px solid ${({ $success }) => ($success ? "#bbf7d0" : "#fecaca")};
  font-weight: 600;
  font-size: 0.9375rem;
`;

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ResultField = styled.div`
  padding: 0.625rem 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #f3f4f6;
`;

const FieldLabel = styled.div`
  font-size: 0.6875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.1875rem;
`;

const FieldValue = styled.div`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
`;

const CounterDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: #ede9fe;
  border-radius: 0.5rem;
  border: 1px solid #c4b5fd;
`;

const CounterNumber = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
  color: #7c3aed;
`;

const CounterLabel = styled.span`
  font-size: 0.8125rem;
  color: #6b7280;
`;

const ModeBadge = styled.span<{ $mode: string }>`
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $mode }) => {
    switch ($mode) {
      case "SINGLE_USE": return "#fef2f2";
      case "ONCE_PER_DAY": return "#fef3c7";
      case "MULTI_USE": return "#dcfce7";
      case "LIMITED_MULTI": return "#ede9fe";
      default: return "#f3f4f6";
    }
  }};
  color: ${({ $mode }) => {
    switch ($mode) {
      case "SINGLE_USE": return "#dc2626";
      case "ONCE_PER_DAY": return "#92400e";
      case "MULTI_USE": return "#166534";
      case "LIMITED_MULTI": return "#7c3aed";
      default: return "#6b7280";
    }
  }};
`;

const ActionButtons = styled.div`
  margin-top: 1.25rem;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const Button = styled.button<{ $variant: "primary" | "secondary" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.875rem;

  ${({ $variant }) =>
    $variant === "primary"
      ? `
    background: #7c3aed;
    color: white;
    &:hover { background: #6d28d9; }
  `
      : `
    background: #6b7280;
    color: white;
    &:hover { background: #4b5563; }
  `}
`;

// ---- Types ----

interface ScanPassResult {
  id: string;
  name: string;
  type: string;
  redemptionMode: string;
  redemptionModeLabel?: string;
  remainingUses?: number;
  totalUsed?: number;
}

interface ScanResultData {
  isValid: boolean;
  message: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  pass?: ScanPassResult;
  promotion?: {
    id: string;
    title: string;
    type: string;
  };
}

interface ScanResult {
  success: boolean;
  data?: ScanResultData;
  error?: string;
}

// ---- Component ----

interface QRScannerProps {
  barId: string;
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
        qrbox: { width: 250, height: 250 },
        fps: 5,
        supportedScanTypes: [],
      },
      false,
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
          setScanResult({
            success: false,
            error: error instanceof Error ? error.message : "Failed to process QR code",
          });
        }
      },
      (error: string) => {
        console.warn(`QR scan warning: ${error}`);
      },
    );
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      setIsScanning(false);
    }
  };

  const processQRCode = async (rawQr: string): Promise<ScanResult> => {
    try {
      const token = localStorage.getItem("hoppr_token");

      // Send raw QR string — server handles format detection
      const response = await fetch(`/api/auth/bar/${barId}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrData: rawQr }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process scan");
      }

      const json = await response.json();
      const data = json.data as ScanResultData;

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    if (!isScanning) {
      startScanner();
    }
  };

  const passTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      SKIP_LINE: "Skip Line",
      COVER_INCLUDED: "Cover Included",
      PREMIUM_ENTRY: "Premium Entry",
      DRINK_PACKAGE: "Drink Package",
    };
    return labels[type] || type;
  };

  return (
    <ScannerContainer>
      <ScannerTitle>QR Scanner</ScannerTitle>
      <ScannerSubtitle>
        Scan customer QR codes to validate VIP passes and promotions
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
            <div id="qr-reader" style={{ width: "100%" }} />
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
          <StatusBanner $success={!!(scanResult.data?.isValid)}>
            {scanResult.data?.isValid ? "✅" : "❌"}{" "}
            {scanResult.data?.message || scanResult.error || "Unknown result"}
          </StatusBanner>

          {scanResult.data && (
            <>
              {/* Customer Info */}
              {scanResult.data.customer && (
                <ResultGrid>
                  <ResultField>
                    <FieldLabel>Customer</FieldLabel>
                    <FieldValue>{scanResult.data.customer.name}</FieldValue>
                  </ResultField>
                  <ResultField>
                    <FieldLabel>Email</FieldLabel>
                    <FieldValue>{scanResult.data.customer.email}</FieldValue>
                  </ResultField>
                </ResultGrid>
              )}

              {/* VIP Pass Details */}
              {scanResult.data.pass && (
                <div style={{ marginTop: "0.75rem" }}>
                  <ResultGrid>
                    <ResultField>
                      <FieldLabel>Pass</FieldLabel>
                      <FieldValue>{scanResult.data.pass.name}</FieldValue>
                    </ResultField>
                    <ResultField>
                      <FieldLabel>Type</FieldLabel>
                      <FieldValue>{passTypeLabel(scanResult.data.pass.type)}</FieldValue>
                    </ResultField>
                    <ResultField>
                      <FieldLabel>Redemption Mode</FieldLabel>
                      <FieldValue>
                        <ModeBadge $mode={scanResult.data.pass.redemptionMode}>
                          {scanResult.data.pass.redemptionModeLabel || scanResult.data.pass.redemptionMode}
                        </ModeBadge>
                      </FieldValue>
                    </ResultField>
                    {scanResult.data.pass.totalUsed !== undefined && (
                      <ResultField>
                        <FieldLabel>Times Used</FieldLabel>
                        <FieldValue>{scanResult.data.pass.totalUsed}</FieldValue>
                      </ResultField>
                    )}
                  </ResultGrid>

                  {/* Live Counter for limited-multi passes */}
                  {scanResult.data.pass.redemptionMode === "LIMITED_MULTI" &&
                    scanResult.data.pass.remainingUses !== undefined && (
                      <CounterDisplay>
                        <CounterNumber>{scanResult.data.pass.remainingUses}</CounterNumber>
                        <CounterLabel>redemptions remaining</CounterLabel>
                      </CounterDisplay>
                    )}

                  {scanResult.data.pass.redemptionMode === "MULTI_USE" &&
                    scanResult.data.pass.totalUsed !== undefined && (
                      <CounterDisplay style={{ background: "#dcfce7", border: "1px solid #86efac" }}>
                        <CounterNumber style={{ color: "#16a34a" }}>
                          {scanResult.data.pass.totalUsed}
                        </CounterNumber>
                        <CounterLabel>total redemptions (unlimited)</CounterLabel>
                      </CounterDisplay>
                    )}
                </div>
              )}

              {/* Promotion Details */}
              {scanResult.data.promotion && (
                <div style={{ marginTop: "0.75rem" }}>
                  <ResultGrid>
                    <ResultField>
                      <FieldLabel>Promotion</FieldLabel>
                      <FieldValue>{scanResult.data.promotion.title}</FieldValue>
                    </ResultField>
                    <ResultField>
                      <FieldLabel>Type</FieldLabel>
                      <FieldValue>{scanResult.data.promotion.type}</FieldValue>
                    </ResultField>
                  </ResultGrid>
                </div>
              )}
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
