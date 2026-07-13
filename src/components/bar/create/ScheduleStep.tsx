"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import type { ContentType, FormState } from "./types";

// ---- Types ----

interface ScheduleStepProps {
  contentType: ContentType;
  formState: FormState;
  barId: string;
  barName?: string;
  onFieldChange: (field: string, value: unknown) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface OptimalTime {
  day: string;
  recommendedSendHour: number;
  peakHour: number;
  peakLevel: string;
}

// ---- Helpers ----

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function formatOptimalTime(time: OptimalTime): string {
  return `${time.day} ${formatHour(time.recommendedSendHour)}`;
}

const REMINDER_OPTIONS = [
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 240, label: "4 hours before" },
  { value: 1440, label: "1 day before" },
];

// ---- Component ----

export default function ScheduleStep({
  contentType,
  formState,
  barId,
  barName,
  onFieldChange,
  onBack,
  onContinue,
}: ScheduleStepProps) {
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([]);
  const [loadingOptimal, setLoadingOptimal] = useState(false);

  // Fetch optimal send times from scheduler insights
  const fetchOptimalTimes = useCallback(async () => {
    setLoadingOptimal(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hoppr_token="))
        ?.split("=")[1];

      const res = await fetch(
        `/api/auth/bar/${barId}/scheduler/insights`,
        {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        if (data.hasData && data.days?.length > 0) {
          // Sort by recommendedSendHour, pick the top 3 days
          const sorted = [...data.days]
            .filter((d: OptimalTime) => d.recommendedSendHour != null)
            .sort(
              (a: OptimalTime, b: OptimalTime) =>
                a.recommendedSendHour - b.recommendedSendHour,
            );
          setOptimalTimes(sorted.slice(0, 3));
        }
      }
    } catch {
      // Non-critical — optimal time is a suggestion
    } finally {
      setLoadingOptimal(false);
    }
  }, [barId]);

  useEffect(() => {
    fetchOptimalTimes();
  }, [fetchOptimalTimes]);

  const today = new Date();
  const minDateTime = new Date(
    today.getTime() + 30 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 16);

  const showEventReminder = contentType === "event";

  return (
    <Container>
      {/* Publish timing — when content goes live in the consumer app */}
      <Section>
        <SectionTitle>When should this go live?</SectionTitle>
        <TimingOptions>
          <TimingCard
            $selected={!formState.scheduledPublishAt}
            onClick={() => onFieldChange("scheduledPublishAt", "")}
          >
            <TimingRadio $selected={!formState.scheduledPublishAt} />
            <TimingContent>
              <TimingLabel>Now</TimingLabel>
              <TimingDesc>
                Visible to customers immediately after publishing
              </TimingDesc>
            </TimingContent>
          </TimingCard>
          <TimingCard
            $selected={!!formState.scheduledPublishAt}
            onClick={() => {
              // Set a default time (1 hour from now) if empty
              if (!formState.scheduledPublishAt) {
                const defaultTime = new Date(
                  Date.now() + 60 * 60 * 1000,
                )
                  .toISOString()
                  .slice(0, 16);
                onFieldChange("scheduledPublishAt", defaultTime);
              }
            }}
          >
            <TimingRadio $selected={!!formState.scheduledPublishAt} />
            <TimingContent>
              <TimingLabel>Schedule for later</TimingLabel>
              <TimingDesc>
                Hidden from customers until the chosen time. Your notification
                (if enabled below) will also wait until then.
              </TimingDesc>
              {formState.scheduledPublishAt && (
                <CustomTimeInput
                  type="datetime-local"
                  value={formState.scheduledPublishAt}
                  min={minDateTime}
                  onChange={(e) =>
                    onFieldChange("scheduledPublishAt", e.target.value)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </TimingContent>
          </TimingCard>
        </TimingOptions>
      </Section>

      {/* Notify followers toggle */}
      <Section>
        <SectionTitle>Notify your followers</SectionTitle>
        <ToggleRow
          onClick={() =>
            onFieldChange("notifyFollowers", !formState.notifyFollowers)
          }
        >
          <ToggleLabel>
            Send a push notification about this{" "}
            {contentType === "event"
              ? "event"
              : contentType === "pass"
                ? "pass"
                : "promotion"}
          </ToggleLabel>
          <ToggleTrack
            $active={formState.notifyFollowers}
          >
            <ToggleThumb $active={formState.notifyFollowers} />
          </ToggleTrack>
        </ToggleRow>
      </Section>

      {formState.notifyFollowers && (
        <Section>
          <SectionTitle>When to send?</SectionTitle>

          <TimingOptions>
            <TimingCard
              $selected={formState.notifyTiming === "now"}
              onClick={() => onFieldChange("notifyTiming", "now")}
            >
              <TimingRadio
                $selected={formState.notifyTiming === "now"}
              />
              <TimingContent>
                <TimingLabel>Now</TimingLabel>
                <TimingDesc>
                  Notification goes out immediately after publishing
                </TimingDesc>
              </TimingContent>
            </TimingCard>

            <TimingCard
              $selected={formState.notifyTiming === "optimal"}
              onClick={() => onFieldChange("notifyTiming", "optimal")}
            >
              <TimingRadio
                $selected={formState.notifyTiming === "optimal"}
              />
              <TimingContent>
                <TimingLabel>
                  Optimal time
                  {optimalTimes.length > 0 && (
                    <OptimalSuggestion>
                      {formatOptimalTime(optimalTimes[0])}
                    </OptimalSuggestion>
                  )}
                </TimingLabel>
                <TimingDesc>
                  {loadingOptimal
                    ? "Loading your bar's best time..."
                    : optimalTimes.length > 0
                      ? `Your followers are most active ${optimalTimes[0].day.toLowerCase()}s around ${formatHour(optimalTimes[0].peakHour)}. We'll send ${formatHour(optimalTimes[0].recommendedSendHour)} to catch the ramp-up.`
                      : "Send when your followers are most likely to engage, based on your bar's crowd patterns."}
                </TimingDesc>
                {optimalTimes.length > 1 && (
                  <AltTimes>
                    Also good:{" "}
                    {optimalTimes
                      .slice(1)
                      .map((t) => formatOptimalTime(t))
                      .join(", ")}
                  </AltTimes>
                )}
              </TimingContent>
            </TimingCard>

            <TimingCard
              $selected={formState.notifyTiming === "custom"}
              onClick={() => onFieldChange("notifyTiming", "custom")}
            >
              <TimingRadio
                $selected={formState.notifyTiming === "custom"}
              />
              <TimingContent>
                <TimingLabel>Custom time</TimingLabel>
                <TimingDesc>
                  Pick a specific date and time for the notification
                </TimingDesc>
                {formState.notifyTiming === "custom" && (
                  <CustomTimeInput
                    type="datetime-local"
                    value={formState.notifyCustomTime}
                    min={minDateTime}
                    onChange={(e) =>
                      onFieldChange("notifyCustomTime", e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </TimingContent>
            </TimingCard>
          </TimingOptions>
        </Section>
      )}

      {/* Event reminder section — only for events */}
      {showEventReminder && (
        <Section>
          <SectionTitle>Event reminder</SectionTitle>
          <ToggleRow
            onClick={() =>
              onFieldChange(
                "remindBeforeEvent",
                !formState.remindBeforeEvent,
              )
            }
          >
            <ToggleLabel>
              Send a reminder to attendees before the event starts
            </ToggleLabel>
            <ToggleTrack
              $active={formState.remindBeforeEvent}
            >
              <ToggleThumb $active={formState.remindBeforeEvent} />
            </ToggleTrack>
          </ToggleRow>

          {formState.remindBeforeEvent && (
            <ReminderOptions>
              <ReminderLabel>How far in advance?</ReminderLabel>
              <ReminderSelect
                value={formState.remindMinutesBefore}
                onChange={(e) =>
                  onFieldChange(
                    "remindMinutesBefore",
                    Number(e.target.value),
                  )
                }
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </ReminderSelect>
            </ReminderOptions>
          )}
        </Section>
      )}

      {/* Summary */}
      <SummaryBox>
        <SummaryTitle>Schedule summary</SummaryTitle>
        {formState.notifyFollowers ? (
          <SummaryItem>
            <SummaryIcon>🔔</SummaryIcon>
            <SummaryText>
              {formState.notifyTiming === "now"
                ? "Notification sent immediately after publishing"
                : formState.notifyTiming === "optimal"
                  ? optimalTimes.length > 0
                    ? `Notification scheduled for optimal time (~${formatOptimalTime(optimalTimes[0])})`
                    : "Notification scheduled at optimal time"
                  : formState.notifyCustomTime
                    ? `Notification scheduled for ${new Date(formState.notifyCustomTime).toLocaleString("fi-FI", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                    : "Pick a custom time for the notification"}
            </SummaryText>
          </SummaryItem>
        ) : (
          <SummaryItem>
            <SummaryIcon>🔕</SummaryIcon>
            <SummaryText>
              No notification will be sent — your followers won't be notified
            </SummaryText>
          </SummaryItem>
        )}
        {showEventReminder && formState.remindBeforeEvent && (
          <SummaryItem>
            <SummaryIcon>⏰</SummaryIcon>
            <SummaryText>
              Reminder sent{" "}
              {REMINDER_OPTIONS.find(
                (o) => o.value === formState.remindMinutesBefore,
              )?.label.toLowerCase() || "2 hours before"}{" "}
              the event
            </SummaryText>
          </SummaryItem>
        )}
      </SummaryBox>

      {/* Navigation */}
      <SubmitRow>
        <BackLink onClick={onBack}>← Back to images</BackLink>
        <ContinueButton onClick={onContinue}>
          Continue to review
        </ContinueButton>
      </SubmitRow>
    </Container>
  );
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionTitle = styled.h3`
  font-size: 12px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
`;

// ---- Toggle ----

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #0d0d1a;
  border: 1px solid #2d2d4a;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover {
    border-color: #3d3d5a;
  }
`;

const ToggleLabel = styled.span`
  font-size: 13px;
  color: #d1d5db;
  font-weight: 500;
`;

const ToggleTrack = styled.div<{ $active: boolean }>`
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: ${({ $active }) => ($active ? "#7c3aed" : "#374151")};
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
`;

const ToggleThumb = styled.div<{ $active: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  position: absolute;
  top: 3px;
  left: ${({ $active }) => ($active ? "21px" : "3px")};
  transition: left 0.2s;
`;

// ---- Timing options ----

const TimingOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TimingCard = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: ${({ $selected }) =>
    $selected ? "rgba(124, 58, 237, 0.08)" : "#0d0d1a"};
  border: 1px solid
    ${({ $selected }) => ($selected ? "#7c3aed" : "#2d2d4a")};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ $selected }) => ($selected ? "#7c3aed" : "#3d3d5a")};
  }
`;

const TimingRadio = styled.div<{ $selected: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${({ $selected }) => ($selected ? "#7c3aed" : "#4b5563")};
  background: ${({ $selected }) => ($selected ? "#7c3aed" : "transparent")};
  flex-shrink: 0;
  margin-top: 1px;
  transition: all 0.2s;
  position: relative;
  &::after {
    content: "";
    display: ${({ $selected }) => ($selected ? "block" : "none")};
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

const TimingContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const TimingLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OptimalSuggestion = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 1px 8px;
  border-radius: 10px;
`;

const TimingDesc = styled.span`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
`;

const AltTimes = styled.span`
  font-size: 10px;
  color: #4b5563;
  margin-top: 2px;
`;

const CustomTimeInput = styled.input`
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid #2d2d4a;
  border-radius: 8px;
  background: #0d0d1a;
  color: #e5e7eb;
  font-size: 13px;
  font-family: inherit;
  width: 100%;
  max-width: 260px;
  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
`;

// ---- Event reminder ----

const ReminderOptions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(124, 58, 237, 0.04);
  border: 1px solid rgba(124, 58, 237, 0.12);
  border-radius: 8px;
  margin-top: 2px;
`;

const ReminderLabel = styled.span`
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
`;

const ReminderSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid #2d2d4a;
  border-radius: 6px;
  background: #0d0d1a;
  color: #e5e7eb;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: #7c3aed;
  }
`;

// ---- Summary ----

const SummaryBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(16, 185, 129, 0.04);
  border: 1px solid rgba(16, 185, 129, 0.12);
  border-radius: 10px;
`;

const SummaryTitle = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const SummaryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryIcon = styled.span`
  font-size: 14px;
  flex-shrink: 0;
`;

const SummaryText = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

// ---- Navigation ----

const SubmitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid #2d2d4a;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  padding: 0;
  &:hover {
    color: #a78bfa;
  }
`;

const ContinueButton = styled.button`
  padding: 10px 28px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #6d28d9;
  }
`;
