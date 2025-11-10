// src/components/admin/add-bar-form/AddBarForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const Container = styled.div`
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;

  ${({ $variant }) =>
    $variant === "primary"
      ? `
        background: #3b82f6;
        color: white;
        &:hover { background: #2563eb; }
      `
      : `
        background: #6b7280;
        color: white;
        &:hover { background: #4b5563; }
      `}
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
`;

const AddBarForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "PUB",
    address: "",
    city: "",
    district: "",
    phone: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!formData.name || !formData.address || !formData.city) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/api/admin/bars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // Success - redirect to bars list
        router.push("/admin/bars");
      } else {
        throw new Error(result.error || "Failed to create bar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bar");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Container>
      <Title>Add New Bar</Title>

      <Form onSubmit={handleSubmit}>
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <InputGroup>
          <Label htmlFor="name">Bar Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter bar name"
            required
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="type">Bar Type *</Label>
          <Select
            id="type"
            value={formData.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            required
          >
            <option value="PUB">Pub</option>
            <option value="CLUB">Club</option>
            <option value="LOUNGE">Lounge</option>
            <option value="COCKTAIL_BAR">Cocktail Bar</option>
            <option value="RESTAURANT_BAR">Restaurant Bar</option>
            <option value="SPORTS_BAR">Sports Bar</option>
            <option value="KARAOKE">Karaoke</option>
            <option value="LIVE_MUSIC">Live Music</option>
          </Select>
        </InputGroup>

        <InputGroup>
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            placeholder="Street address"
            required
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            placeholder="City"
            required
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="district">District/Area</Label>
          <Input
            id="district"
            type="text"
            value={formData.district}
            onChange={(e) => handleInputChange("district", e.target.value)}
            placeholder="District or neighborhood"
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="+358 40 123 4567"
          />
        </InputGroup>

        <InputGroup>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="contact@bar.com"
          />
        </InputGroup>

        <ButtonGroup>
          <Button
            type="button"
            $variant="secondary"
            onClick={() => router.push("/admin/bars")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" $variant="primary" disabled={loading}>
            {loading ? "Creating..." : "Create Bar"}
          </Button>
        </ButtonGroup>
      </Form>
    </Container>
  );
};

export default AddBarForm;
