"use client";

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";

// ---- Styled Components ----

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CreateButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;

  &:hover {
    background: #6d28d9;
  }
`;

// Filter tabs
const FilterTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  padding: 0.625rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  color: ${({ $active }) => ($active ? "#7c3aed" : "#6b7280")};
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  cursor: pointer;
  margin-bottom: -2px;
  transition: all 0.2s;

  &:hover {
    color: #374151;
  }
`;

// Event cards
const EventGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EventCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  transition: box-shadow 0.2s;
  flex-wrap: wrap;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const EventInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const EventTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const EventMeta = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const EventActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

const ActionButton = styled.button<{ $variant: "outline" | "danger" }>`
  padding: 0.5rem 0.875rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${({ $variant }) => ($variant === "danger" ? "#fecaca" : "#d1d5db")};
  background: white;
  color: ${({ $variant }) => ($variant === "danger" ? "#dc2626" : "#374151")};

  &:hover {
    background: ${({ $variant }) => ($variant === "danger" ? "#fef2f2" : "#f3f4f6")};
  }
`;

// Badge
const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: ${({ $color }) => {
    switch ($color) {
      case "upcoming": return "#dcfce7";
      case "past": return "#f3f4f6";
      default: return "#e5e7eb";
    }
  }};
  color: ${({ $color }) => {
    switch ($color) {
      case "upcoming": return "#166534";
      case "past": return "#6b7280";
      default: return "#374151";
    }
  }};
`;

// Modal overlay
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Modal = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.25rem 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.375rem;
  color: #374151;
  font-size: 0.8125rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const ModalButton = styled.button<{ $variant: "primary" | "outline" | "danger" }>`
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${({ $variant }) => ($variant === "outline" ? "#d1d5db" : "transparent")};
  background: ${({ $variant }) => {
    switch ($variant) {
      case "primary": return "#7c3aed";
      case "danger": return "#ef4444";
      default: return "white";
    }
  }};
  color: ${({ $variant }) => ($variant === "outline" ? "#374151" : "white")};

  &:hover {
    background: ${({ $variant }) => {
      switch ($variant) {
        case "primary": return "#6d28d9";
        case "danger": return "#dc2626";
        default: return "#f3f4f6";
      }
    }};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Attendee list
const AttendeeList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const AttendeeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const AttendeeName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
`;

const AttendeeMeta = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

// Empty state
const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
`;

const EmptyIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
`;

const EmptyText = styled.div`
  font-size: 0.9375rem;
  margin-bottom: 0.25rem;
`;

const EmptySubtext = styled.div`
  font-size: 0.8125rem;
`;

// Loading / Error
const LoadingOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
  font-size: 1rem;
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

// ---- Types ----

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  maxAttendees: number | null;
  isPrivate: boolean;
  imageUrl: string | null;
  attendeeCount: number;
  complianceStatus: string;
  createdAt: string;
}

interface Attendee {
  userId: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  joinedAt: string;
}

interface EventDetail extends EventItem {
  venueId: string;
  venueName: string;
  venueType: string;
  attendees: Attendee[];
}

interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  maxAttendees: string;
  isPrivate: boolean;
}

// ---- Helpers ----

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocal(iso: string): string {
  // Convert ISO string to datetime-local input value (YYYY-MM-DDTHH:mm)
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isUpcoming(iso: string): boolean {
  return new Date(iso) > new Date();
}

// ---- Component ----

interface EventsManagerProps {
  barId: string;
  userRole: string;
}

const EventsManager = ({ barId, userRole }: EventsManagerProps) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventDetail | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    maxAttendees: "",
    isPrivate: false,
  });
  const [saving, setSaving] = useState(false);

  // Attendee modal
  const [showAttendees, setShowAttendees] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeeEventTitle, setAttendeeEventTitle] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("hoppr_token") : null;

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/bar/${barId}/events?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [barId, filter, token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = () => {
    setEditingEvent(null);
    // Default start time = now + 1 hour, rounded to nearest hour
    const defaultStart = new Date();
    defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultEnd.getHours() + 3);

    setFormData({
      title: "",
      description: "",
      startTime: toDatetimeLocal(defaultStart.toISOString()),
      endTime: toDatetimeLocal(defaultEnd.toISOString()),
      maxAttendees: "",
      isPrivate: false,
    });
    setShowForm(true);
  };

  const handleEdit = async (event: EventItem) => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`/api/auth/bar/${barId}/events/${event.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const data = await res.json();
      const detail = data.event as EventDetail;
      setEditingEvent(detail);

      setFormData({
        title: detail.title,
        description: detail.description || "",
        startTime: toDatetimeLocal(detail.startTime),
        endTime: detail.endTime ? toDatetimeLocal(detail.endTime) : "",
        maxAttendees: detail.maxAttendees?.toString() || "",
        isPrivate: detail.isPrivate,
      });
      setShowForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
    }
  };

  const handleSave = async () => {
    if (!token || !formData.title.trim() || !formData.startTime) return;

    setSaving(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees, 10) : null,
        isPrivate: formData.isPrivate,
      };

      let res: Response;
      if (editingEvent) {
        res = await fetch(`/api/auth/bar/${barId}/events/${editingEvent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/auth/bar/${barId}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Failed: ${res.status}`);
      }

      setShowForm(false);
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleViewAttendees = async (event: EventItem) => {
    if (!token) return;
    setAttendeeEventTitle(event.title);
    setShowAttendees(true);
    setAttendeesLoading(true);

    try {
      const res = await fetch(`/api/auth/bar/${barId}/events/${event.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      const data = await res.json();
      setAttendees(data.event.attendees || []);
    } catch {
      setAttendees([]);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/auth/bar/${barId}/events/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      setDeleteTarget(null);
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel event");
    } finally {
      setDeleting(false);
    }
  };

  const canManage = userRole === "OWNER" || userRole === "MANAGER";

  return (
    <Container>
      <Header>
        <Title>Events</Title>
        {canManage && (
          <CreateButton onClick={handleCreate}>+ Create Event</CreateButton>
        )}
      </Header>

      <FilterTabs>
        {(["upcoming", "past", "all"] as const).map((f) => (
          <FilterTab key={f} $active={filter === f} onClick={() => setFilter(f)}>
            {f === "upcoming" ? "Upcoming" : f === "past" ? "Past" : "All Events"}
          </FilterTab>
        ))}
      </FilterTabs>

      {error && (
        <ErrorBox>
          {error}
          <button
            onClick={fetchEvents}
            style={{
              marginLeft: "1rem",
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </ErrorBox>
      )}

      {loading ? (
        <LoadingOverlay>Loading events...</LoadingOverlay>
      ) : events.length === 0 ? (
        <EmptyState>
          <EmptyIcon>📅</EmptyIcon>
          <EmptyText>No {filter !== "all" ? filter : ""} events yet</EmptyText>
          <EmptySubtext>
            {canManage
              ? "Create your first event to start engaging customers"
              : "Check back when events are scheduled"}
          </EmptySubtext>
        </EmptyState>
      ) : (
        <EventGrid>
          {events.map((event) => (
            <EventCard key={event.id}>
              <EventInfo>
                <EventTitle>{event.title}</EventTitle>
                <EventMeta>
                  <span>📅 {formatDateTime(event.startTime)}</span>
                  {event.endTime && <span>→ {formatDateTime(event.endTime)}</span>}
                  <span>👥 {event.attendeeCount} attending</span>
                  <Badge $color={isUpcoming(event.startTime) ? "upcoming" : "past"}>
                    {isUpcoming(event.startTime) ? "Upcoming" : "Past"}
                  </Badge>
                  {event.isPrivate && <span>🔒 Private</span>}
                </EventMeta>
              </EventInfo>
              <EventActions>
                {event.attendeeCount > 0 && (
                  <ActionButton
                    $variant="outline"
                    onClick={() => handleViewAttendees(event)}
                  >
                    Attendees ({event.attendeeCount})
                  </ActionButton>
                )}
                {canManage && (
                  <>
                    <ActionButton
                      $variant="outline"
                      onClick={() => handleEdit(event)}
                    >
                      Edit
                    </ActionButton>
                    <ActionButton
                      $variant="danger"
                      onClick={() => setDeleteTarget(event)}
                    >
                      Cancel
                    </ActionButton>
                  </>
                )}
              </EventActions>
            </EventCard>
          ))}
        </EventGrid>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <ModalOverlay onClick={() => setShowForm(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {editingEvent ? "Edit Event" : "Create Event"}
            </ModalTitle>

            <FormGroup>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Live Music Friday"
              />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What's happening at this event?"
              />
            </FormGroup>

            <FormGroup>
              <Label>Start Time *</Label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Max Attendees</Label>
              <Input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) =>
                  setFormData({ ...formData, maxAttendees: e.target.value })
                }
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </FormGroup>

            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) =>
                    setFormData({ ...formData, isPrivate: e.target.checked })
                  }
                />
                Private event (only visible to invited guests)
              </CheckboxLabel>
            </FormGroup>

            <ButtonRow>
              <ModalButton
                $variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </ModalButton>
              <ModalButton
                $variant="primary"
                onClick={handleSave}
                disabled={saving || !formData.title.trim() || !formData.startTime}
              >
                {saving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
              </ModalButton>
            </ButtonRow>
          </Modal>
        </ModalOverlay>
      )}

      {/* Attendees Modal */}
      {showAttendees && (
        <ModalOverlay onClick={() => setShowAttendees(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Attendees — {attendeeEventTitle}</ModalTitle>

            {attendeesLoading ? (
              <LoadingOverlay>Loading attendees...</LoadingOverlay>
            ) : attendees.length === 0 ? (
              <EmptyState>
                <EmptyText>No attendees yet</EmptyText>
              </EmptyState>
            ) : (
              <AttendeeList>
                {attendees.map((a) => (
                  <AttendeeRow key={a.userId}>
                    <div>
                      <AttendeeName>{a.name || a.username || "Anonymous"}</AttendeeName>
                      <AttendeeMeta>{a.email}</AttendeeMeta>
                    </div>
                    <AttendeeMeta>
                      Joined {new Date(a.joinedAt).toLocaleDateString()}
                    </AttendeeMeta>
                  </AttendeeRow>
                ))}
              </AttendeeList>
            )}

            <ButtonRow>
              <ModalButton
                $variant="outline"
                onClick={() => setShowAttendees(false)}
              >
                Close
              </ModalButton>
            </ButtonRow>
          </Modal>
        </ModalOverlay>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <ModalOverlay onClick={() => setDeleteTarget(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Cancel Event</ModalTitle>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              Are you sure you want to cancel{" "}
              <strong style={{ color: "#1f2937" }}>{deleteTarget.title}</strong>?
              This will permanently delete the event and all attendee records.
            </p>
            <ButtonRow>
              <ModalButton
                $variant="outline"
                onClick={() => setDeleteTarget(null)}
              >
                Keep Event
              </ModalButton>
              <ModalButton
                $variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Cancelling..." : "Yes, Cancel Event"}
              </ModalButton>
            </ButtonRow>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default EventsManager;
