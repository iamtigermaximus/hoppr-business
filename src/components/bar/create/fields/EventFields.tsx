"use client";

import styled from "styled-components";
import {
  FormGroup,
  Label,
  Input,
  Select,
  CheckboxLabel,
  InlineRow,
} from "../shared/FormPrimitives";

// ---- Types ----

interface EventFieldsProps {
  startTime: string;
  endTime: string;
  maxAttendees: number | null;
  isPrivate: boolean;
  onChange: (field: string, value: unknown) => void;
}

// ---- Helpers ----

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 16); // "2026-05-31T20:00"
}

// ---- Component ----

export default function EventFields({
  startTime,
  endTime,
  maxAttendees,
  isPrivate,
  onChange,
}: EventFieldsProps) {
  return (
    <>
      <InlineRow>
        <FormGroup>
          <Label>Start Time *</Label>
          <Input
            type="datetime-local"
            value={toDatetimeLocal(startTime)}
            onChange={(e) => onChange("startTime", new Date(e.target.value).toISOString())}
            required
          />
        </FormGroup>
        <FormGroup>
          <Label>End Time</Label>
          <Input
            type="datetime-local"
            value={toDatetimeLocal(endTime)}
            onChange={(e) =>
              onChange("endTime", e.target.value ? new Date(e.target.value).toISOString() : null)
            }
          />
        </FormGroup>
      </InlineRow>

      <InlineRow>
        <FormGroup>
          <Label>Max Attendees</Label>
          <Input
            type="number"
            placeholder="No limit"
            value={maxAttendees ?? ""}
            onChange={(e) =>
              onChange("maxAttendees", e.target.value ? Number(e.target.value) : null)
            }
            min={0}
          />
        </FormGroup>
        <FormGroup>
          <Label>&nbsp;</Label>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => onChange("isPrivate", e.target.checked)}
            />
            Private event (hidden from public feed)
          </CheckboxLabel>
        </FormGroup>
      </InlineRow>
    </>
  );
}
